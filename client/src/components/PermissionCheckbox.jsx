import { FaLock } from "react-icons/fa";

const PermissionCheckbox = ({ permission, isSelected, onChange, disabled }) => {
    return (
        <div className={`flex items-start p-3 rounded-lg border ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200 hover:bg-slate-50'} transition-colors`}>
            <div className="flex items-center h-5">
                <input
                    id={`perm-${permission._id}`}
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => onChange(permission._id, e.target.checked)}
                    disabled={disabled}
                    className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 disabled:opacity-50"
                />
            </div>
            <div className="ml-3 text-sm">
                <label htmlFor={`perm-${permission._id}`} className={`font-medium ${disabled ? 'text-slate-400' : 'text-slate-900 cursor-pointer'}`}>
                    <div className="flex items-center gap-2">
                        {permission.name}
                        {disabled && <FaLock className="text-slate-400" size={10} title="Cannot modify system role permissions" />}
                    </div>
                </label>
                <p className={`text-xs ${disabled ? 'text-slate-400' : 'text-slate-500'} font-mono mt-0.5`}>
                    {permission.code}
                </p>
                {permission.description && (
                    <p className={`text-xs ${disabled ? 'text-slate-400' : 'text-slate-500'} mt-1`}>
                        {permission.description}
                    </p>
                )}
            </div>
        </div>
    );
};

export default PermissionCheckbox;
