function AdminHome({ children }) {

    return (
        <>
            <div className="w-full">
                <h1 className="text-2xl font-bold mb-6">Admin Home</h1>
            </div>
            <div className="w-full">
                {children}
            </div>
        </>

    );
}

export default AdminHome;