import React from "react";
import CredentialsPanel from "./CredentialsPanel";
import TokenPoliciesForm from "./TokenPoliciesForm";
import ActiveSessionsTable from "./ActiveSessionsTable";
import AccessControlPanel from "./AccessControlPanel";

const SecuritySettingsTab = ({ applicationId }) => {
    return (
        <div className="space-y-6">
            <CredentialsPanel applicationId={applicationId} />
            <TokenPoliciesForm applicationId={applicationId} />
            <ActiveSessionsTable applicationId={applicationId} />
            <AccessControlPanel applicationId={applicationId} />
        </div>
    );
};

export default SecuritySettingsTab;
