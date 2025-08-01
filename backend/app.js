import express from "express";
import { connect } from "./config/database.config.js";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { typeDefs } from "./graphql/typeDef.graphql.js";
import { resolvers } from "./graphql/resolver.graphql.js";
import ENV_VARS from "./config/envVars.config.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import { redisService } from "./config/redis.config.js";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { useServer as setupWSConnection } from "graphql-ws/lib/use/ws";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { PubSub } from "graphql-subscriptions";
import graphqlUploadExpress from "graphql-upload/graphqlUploadExpress.mjs";
import { userLoader } from "./utils/data_loader/user.data_loader.js";
import signaling from "./signaling.js";
import { onlineStatusService } from "./services/onlineStatus.service.js";
// Connect to the database
connect();

const app = express();
const pubsub = new PubSub();
// https://instagram-project-tbrg.onrender.com
// https://instagramclone-tan.vercel.app/
// Middleware
app.use(
  cors({
    origin: [
      "https://instagramclone-tan.vercel.app",
      "https://instagramclone-tan.vercel.app/",
      "http://localhost:3000",
      "http://localhost:5173",
    ],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(graphqlUploadExpress({ maxFileSize: 100000000, maxFiles: 10 }));

// Create schema
const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

// Create HTTP server
const httpServer = createServer(app);

// Signaling server setup
signaling(httpServer);

// WebSocket setup for GraphQL subscriptions
const wsServer = new WebSocketServer({
  server: httpServer,
  path: "/graphql",
});

// Track active connections
const activeConnections = new Map();
const serverCleanup = setupWSConnection(
  {
    schema,
    context: async (ctx) => {
      const connectionId = Math.random().toString(36).slice(2);
      activeConnections.set(connectionId, { ctx, userId: null });
      ctx.connectionId = connectionId;

      return {
        pubsub,
        connectionId,
        userLoader,
      };
    },
    onConnect: async (ctx) => {
      console.log("WebSocket connected");
      // Extract user info from connection params if available
      const token = ctx.connectionParams?.authorization?.replace("Bearer ", "");
      if (token) {
        try {
          const user = jwt.verify(token, ENV_VARS.JWT_SECRET_KEY);
          const connectionData = activeConnections.get(ctx.connectionId);
          if (connectionData) {
            connectionData.userId = user.user.user_id;
            activeConnections.set(ctx.connectionId, connectionData);

            // Set user online
            await onlineStatusService.setUserOnline(
              user.user.user_id,
              ctx.connectionId
            );

            // Publish status change
            pubsub.publish("USER_STATUS_CHANGED", {
              userStatusChanged: {
                user_id: user.user.user_id,
                is_online: true,
                last_seen: new Date().toISOString(),
              },
            });
          }
        } catch (error) {
          console.error("Token verification failed in WebSocket:", error);
        }
      }
    },
    onDisconnect: async (ctx, code, reason) => {
      console.log("WebSocket disconnected");
      const connectionData = activeConnections.get(ctx.connectionId);
      if (connectionData && connectionData.userId) {
        // Set user offline
        await onlineStatusService.setUserOffline(connectionData.userId);

        // Publish status change
        pubsub.publish("USER_STATUS_CHANGED", {
          userStatusChanged: {
            user_id: connectionData.userId,
            is_online: false,
            last_seen: new Date().toISOString(),
          },
        });
      }
      activeConnections.delete(ctx.connectionId);
    },
    connectionInitWaitTimeout: 10000,
  },
  wsServer
);

// Apollo Server context
const context = async ({ req, res }) => {
  const authHeader = req.headers["authorization"];
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    try {
      const user = jwt.verify(token, ENV_VARS.JWT_SECRET_KEY);
      return { req, user: user, cache: redisService, pubsub, userLoader };
    } catch (error) {
      console.error("Token verification failed: ", error);
    }
  }
  return { req, cache: redisService, pubsub, userLoader };
};

// Apollo Server setup
const server = new ApolloServer({
  schema,
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },
  ],
});

// Start the server
const startServer = async () => {
  await redisService.connect();
  await server.start();
  app.use("/graphql", expressMiddleware(server, { context }));

  // Start cleanup job for offline users
  setInterval(async () => {
    await onlineStatusService.cleanupOfflineUsers();
  }, 60000); // Run every minute

  httpServer.listen(ENV_VARS.PORT, () => {
    console.log(
      ` HTTP server ready at http://localhost:${ENV_VARS.PORT}/graphql`
    );
    console.log(
      `WebSocket server ready at ws://localhost:${ENV_VARS.PORT}/graphql`
    );
    console.log(`Socket.IO server ready at ws://localhost:${ENV_VARS.PORT}`);
  });
};

startServer();
