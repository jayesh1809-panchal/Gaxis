const PermissionScopeBadge = ({ scope }) => {
    let bgColor = "bg-slate-100 text-slate-800";
    let text = scope.toUpperCase();

    if (scope === "SYSTEM") {
        bgColor = "bg-blue-100 text-blue-800";
    } else if (scope === "APPLICATION") {
        bgColor = "bg-purple-100 text-purple-800";
    }

    return (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full border ${scope === "SYSTEM" ? "border-blue-200" : "border-purple-200"} ${bgColor}`}>
            {text}
        </span>
    );
};

export default PermissionScopeBadge;
