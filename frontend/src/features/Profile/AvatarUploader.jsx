import React from 'react';

export default function AvatarUploader({ avatar, onChange }) {
    return (
        <div className="avatar-uploader">
            <img src={avatar || '/avatar-default.png'} alt="avatar" className="rounded-full w-24 h-24" />
            <input type="file" accept="image/*" onChange={onChange} />
        </div>
    );
}