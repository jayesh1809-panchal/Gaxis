import { Link } from "react-router-dom";
import { ROUTES } from "../routes/constants";

const NotFound = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100">
            <h1 className="text-6xl font-bold text-slate-800 mb-4">404</h1>
            <p className="text-xl text-slate-600 mb-8">Page Not Found</p>
            <Link 
                to={ROUTES.DASHBOARD} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium transition-colors"
            >
                Return to Dashboard
            </Link>
        </div>
    );
};

export default NotFound;
