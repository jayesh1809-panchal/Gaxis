const RoleStatusBadge = ({ status }) => {
    let bgColor = "bg-slate-100 text-slate-800";
    let text = status.toUpperCase();

    if (status === "active") {
        bgColor = "bg-green-100 text-green-800";
    } else if (status === "inactive") {
        bgColor = "bg-red-100 text-red-800";
    }

    return (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${bgColor}`}>
            {text}
        </span>
    );
};

export default RoleStatusBadge;
