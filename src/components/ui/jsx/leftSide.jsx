import '../css/leftSide.css';
import React from 'react';
import logoInstagram from '../../../assets/logo.png';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import ExploreIcon from '@mui/icons-material/Explore';
import SlowMotionVideoIcon from '@mui/icons-material/SlowMotionVideo';
import MapsUgcOutlinedIcon from '@mui/icons-material/MapsUgcOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import profileImg from '../../../assets/profilepic.png'
import GestureIcon from '@mui/icons-material/Gesture';
import Menu from '../jsx/menu'
import { useNavigate } from 'react-router-dom';



function LeftSide() {
    // const navigate =- useNavigate
    // const logoutHandler = async()=>{
        
    //     try{
    //          const  res = await axios
    //         if(res.data.success){
    //             navigate('/login')
    //             toast.success(res.data.message)
    //         }
    //     }catch(error){
    //         toast.error(error.respone.dat.message)
    //     }
    // }

    return (
        <div className="leftSidePart">
            <div className="logoPart">
                <img className='logoImg' src={logoInstagram} alt="logo" />
            </div>
            <div className="navLinkPart">
                <div className='navLink'>
                    <HomeIcon sx={{ fontSize: "30px", margin: "0 20px 0 0" }} />
                    <div className="navName">Home</div>
                </div>
                <div className='navLink'>
                    <SearchIcon sx={{ fontSize: "30px", margin: "0 20px 0 0" }} />
                    <div className="navName">Home</div>
                </div>
                <div className='navLink'>
                    <ExploreIcon sx={{ fontSize: "30px", margin: "0 20px 0 0" }} />
                    <div className="navName">Explore</div>
                </div>
                <div className='navLink'>
                    <SlowMotionVideoIcon sx={{ fontSize: "30px", margin: "0 20px 0 0" }} />
                    <div className="navName">Reels</div>
                </div>
                <div className='navLink'>
                    <MapsUgcOutlinedIcon sx={{ fontSize: "30px", margin: "0 20px 0 0" }} />
                    <div className="navName">Messages</div>
                </div>
                <div className='navLink'>
                    <FavoriteBorderOutlinedIcon sx={{ fontSize: "30px", margin: "0 20px 0 0" }} />
                    <div className="navName">Noification</div>
                </div>
                <div className='navLink'>
                    <AddBoxOutlinedIcon sx={{ fontSize: "30px", margin: "0 20px 0 0" }} />
                    <div className="navName">Create</div>
                </div>
                <div className='navLink'>
                    <img className='profileImg' src={profileImg} alt="profileImg" />
                    <div className="navName ">Profile</div>
                </div>
                <div className="belowPart">
                    <div className='navLink'>
                        <GestureIcon sx={{ fontSize: "30px", margin: "0 20px 0 0" }} />
                        <div className="navName ">Threads</div>
                    </div>



                    <Menu />
                </div>

            </div>
        </div>
    )
}
export default LeftSide