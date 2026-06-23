import RoleCheckbox from "./RoleCheckbox";

const RoleGroup = ({ typeName, roles, selectedIds, onToggle, disabled }) => {
    if (!roles || roles.length === 0) return null;

    return (
        <div className="mb-6">
            <h4 className="text-md font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs ${typeName === "SYSTEM" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}`}>
                    {typeName} ROLES
                </span>
                <span className="text-sm font-normal text-slate-500">
                    ({roles.length} roles)
                </span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {roles.map((role) => (
                    <RoleCheckbox
                        key={role._id}
                        role={role}
                        isSelected={selectedIds.includes(role._id)}
                        onChange={onToggle}
                        disabled={disabled}
                    />
                ))}
            </div>
        </div>
    );
};

export default RoleGroup;
