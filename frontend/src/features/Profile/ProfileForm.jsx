// import React, { useState } from 'react';
// import GenderSelector from './GenderSelector';

// export default function ProfileForm({ user, onSave }) {
//     const [form, setForm] = useState(user);
//     // console.log('form: ', form);


//     const handleChange = e => {
//         const { name, value } = e.target;
//         setForm(prev => ({ ...prev, [name]: value }));
//     };

//     const handleGenderChange = e => setForm(prev => ({ ...prev, gender: e.target.value }));

//     const handleAvatarChange = e => {
//         const file = e.target.files[0];
//         if (file) {
//             const reader = new FileReader();
//             reader.onload = ev => setForm(prev => ({ ...prev, avatar: ev.target.result }));
//             reader.readAsDataURL(file);
//         }
//     };

//     const handleSubmit = e => {
//         e.preventDefault();
//         onSave(form);
//     };

//     return (
//         <form onSubmit={handleSubmit} className="bg-white rounded-lg p-8 shadow w-full">
//             <h2 className="text-2xl font-semibold mb-1">Hồ sơ của tôi</h2>
//             <p className="text-gray-500 mb-6">Quản lý thông tin hồ sơ để bảo mật tài khoản</p>
//             <div className="flex">
//                 <div className="flex-1">
//                     <div className="mb-4">
//                         <label className="block text-sm mb-1">Tên đăng nhập:</label>
//                         <input
//                             value={form.username}
//                             disabled
//                             className="w-full border rounded px-3 py-2 bg-gray-100"
//                         />
//                     </div>
//                     <div className="mb-4">
//                         <label className="block text-sm mb-1">Tên:</label>
//                         <input
//                             name="name"
//                             value={form.fullname}
//                             onChange={handleChange}
//                             className="w-full border rounded px-3 py-2"
//                         />
//                     </div>
//                     <div className="mb-4 flex items-center">
//                         <div className="flex-1">
//                             <label className="block text-sm mb-1">Email:</label>
//                             <input
//                                 value={form.email}
//                                 disabled
//                                 className="w-full border rounded px-3 py-2 bg-gray-100"
//                             />
//                         </div>
//                         <span
//                             className="text-purple-500 text-sm ml-2 cursor-pointer"
//                         >
//                             Đổi</span>
//                     </div>
//                     <div className="mb-4 flex items-center">
//                         <div className="flex-1">
//                             <label className="block text-sm mb-1">Số điện thoại:</label>
//                             <input
//                                 value={form.phone}
//                                 disabled
//                                 className="w-full border rounded px-3 py-2 bg-gray-100"
//                             />
//                         </div>
//                         <span
//                             className="text-purple-500 text-sm ml-2 cursor-pointer"
//                         >
//                             Đổi</span>
//                     </div>
//                     <div className="mb-4">
//                         <label className="block text-sm mb-1">Giới tính:</label>
//                         <GenderSelector value={form.gender} onChange={handleGenderChange} />
//                     </div>
//                     <div className="mb-4">
//                         <label className="block text-sm mb-1">Ngày tháng năm sinh:</label>
//                         <input
//                             type="date"
//                             name="dob"
//                             value={form.dob}
//                             onChange={handleChange}
//                             className="border rounded px-3 py-2"
//                         />
//                     </div>
//                     <button
//                         type="submit"
//                         className="mt-4 px-8 py-2 bg-purple-500 text-white rounded font-semibold"
//                     >
//                         Lưu
//                     </button>
//                 </div>
//                 <div className="flex flex-col items-center justify-center w-64">
//                     <img
//                         src={form.avatar || '/images/banners/banner_jean.jpg'}
//                         alt="avatar"
//                         className="rounded-full w-32 h-32 border mb-4"
//                     />
//                     <label
//                         htmlFor="avatar-upload"
//                         className="inline-block px-4 py-2 bg-gray-200 rounded cursor-pointer hover:bg-gray-300"
//                     >
//                         Chọn ảnh
//                     </label>
//                     <input
//                         id="avatar-upload"
//                         type="file"
//                         accept="image/*"
//                         onChange={handleAvatarChange}
//                         className="hidden"
//                     />
//                     <span className="text-gray-400 mt-2">circle</span>
//                 </div>
//             </div>
//         </form>
//     );
// }