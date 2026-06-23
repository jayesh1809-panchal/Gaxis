import PermissionCheckbox from "./PermissionCheckbox";

const PermissionGroup = ({ moduleName, permissions, selectedIds, onToggle, disabled }) => {
    if (!permissions || permissions.length === 0) return null;

    return (
        <div className="mb-6">
            <h4 className="text-md font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs">
                    {moduleName.replace("_", " ")}
                </span>
                <span className="text-sm font-normal text-slate-500">
                    ({permissions.length} permissions)
                </span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {permissions.map((perm) => (
                    <PermissionCheckbox
                        key={perm._id}
                        permission={perm}
                        isSelected={selectedIds.includes(perm._id)}
                        onChange={onToggle}
                        disabled={disabled}
                    />
                ))}
            </div>
        </div>
    );
};

export default PermissionGroup;
