import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setAuthUser } from '../redux/userSlice';
import axios from 'axios';
import toast from 'react-hot-toast';
import { BASE_URL } from '../config';
import { IoClose, IoCamera } from 'react-icons/io5';

const ProfileModal = ({ onClose }) => {
    const { authUser } = useSelector(store => store.user);
    const [preview, setPreview] = useState(authUser?.profilePhoto || '');
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const fileRef = useRef();
    const dispatch = useDispatch();

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('profilePhoto', selectedFile);
            axios.defaults.withCredentials = true;
            const res = await axios.put(`${BASE_URL}/api/v1/user/profile`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                withCredentials: true
            });
            dispatch(setAuthUser({
                ...authUser,
                profilePhoto: res.data.user.profilePhoto
            }));
            toast.success('Profile photo updated!');
            onClose();
        } catch (error) {
            toast.error('Failed to upload');
            console.log(error);
        }
        setUploading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-[#1f2c33] rounded-2xl p-6 w-[360px] shadow-2xl border border-[#2a3942]">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-white text-lg font-semibold">Profile Photo</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <IoClose size={24} />
                    </button>
                </div>

                {/* Avatar Preview */}
                <div className="flex flex-col items-center gap-4">
                    <div className="relative group cursor-pointer" onClick={() => fileRef.current.click()}>
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#00a884] shadow-lg">
                            <img
                                src={preview || 'https://avatar.iran.liara.run/public'}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <IoCamera size={28} className="text-white" />
                        </div>
                    </div>

                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                    />

                    <p className="text-gray-400 text-sm">{authUser?.fullName}</p>
                    <p className="text-gray-500 text-xs">@{authUser?.username}</p>

                    {selectedFile && (
                        <button
                            onClick={handleUpload}
                            disabled={uploading}
                            className="w-full py-2.5 bg-[#00a884] text-white rounded-lg font-medium hover:bg-[#06cf9c] transition-colors disabled:opacity-50"
                        >
                            {uploading ? 'Uploading...' : 'Update Photo'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfileModal;
