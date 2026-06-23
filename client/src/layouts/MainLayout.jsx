import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

const MainLayout = () => {
    return (
        <div className="flex min-h-[calc(100vh-4rem)]">
            <Sidebar />
            <div className="flex-1 bg-slate-100">
                <Header />
                <div className="p-6">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default MainLayout;