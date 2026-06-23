const RoleCheckbox = ({ role, isSelected, onChange, disabled }) => {
    return (
        <div className={`flex items-start p-3 rounded-lg border ${isSelected ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200 hover:bg-slate-50'} transition-colors`}>
            <div className="flex items-center h-5">
                <input
                    id={`role-${role._id}`}
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => onChange(role._id, e.target.checked)}
                    disabled={disabled}
                    className="w-4 h-4 text-indigo-600 bg-slate-100 border-slate-300 rounded focus:ring-indigo-500 disabled:opacity-50"
                />
            </div>
            <div className="ml-3 text-sm">
                <label htmlFor={`role-${role._id}`} className={`font-medium ${disabled ? 'text-slate-400' : 'text-slate-900 cursor-pointer'}`}>
                    {role.name}
                </label>
                <p className={`text-xs ${disabled ? 'text-slate-400' : 'text-slate-500'} font-mono mt-0.5`}>
                    {role.code}
                </p>
                {role.description && (
                    <p className={`text-xs ${disabled ? 'text-slate-400' : 'text-slate-500'} mt-1`}>
                        {role.description}
                    </p>
                )}
            </div>
        </div>
    );
};

export default RoleCheckbox;
