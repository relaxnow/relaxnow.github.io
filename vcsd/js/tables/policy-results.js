class PolicyResultsTable {
    static mitigations = {};
    static rows = [];

    static {
        $('#policyResultsTable').bootstrapTable({
            pagination: true,
            search: true,
            sortSelectOptions: true,
            filterControl: true,
            columns: [
                { field: 'table'            ,title: "Table", visible: false},
                { field: 'id'               ,title: "ID", visible: false},
                { field: 'source'           ,title: 'Source'    , sortable: true, filterControl: 'select'}, 
                { field: 'msg'              ,title: 'Message'   , sortable: true, filterControl: 'input'},
                { field: 'mitigated'        ,title: 'Mitigated' , sortable: true, filterControl: 'select'},
                { field: 'actions'          ,title: 'Actions'           , onClickRow: null, formatter: actionsFormatter, events: {
                    "click .mitigate": (e, value, row, index) => {
                        $('#mitigateForm').submit(function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            const formData = $(this).serializeArray();
                            PolicyResultsTable.updateWithNewMitigation({
                                "id": row.id,
                                "author": formData[0]["value"],
                                "comment": formData[1]["value"],
                                "created": (new Date()).toISOString()
                            });
                            $('#mitigateModal').modal('hide')
                        });
                        $('#mitigateModal').modal('show');
                        e.stopPropagation();
                    },
                }}
            ],
            data: []
        });
    }

    static updateWithNewResults(results) {
        if (typeof results['policy-results'][0]['failures'] === "undefined") {
            results['policy-results'][0]['failures'] = [];
        }
        this.rows = results['policy-results'][0]['failures'].map((policyFailure) => {
            const id = policyFailure.msg;

            return {
                id: id,
                source: policyFailure.msg.split(" ")[0],
                msg: policyFailure.msg,
                mitigated: NOT_MITIGATED
            };
        });

        this.applyMitigations();
    }

    static #updateUI() {
        let allPolicyRowsMitigated = true;
        for (let i = 0; i < this.rows.length; i++) {
            const row = this.rows[i];
            if (row.mitigated === NOT_MITIGATED) {
                allPolicyRowsMitigated = false;
                break;
            }
        }
        if (allPolicyRowsMitigated) {
            document.getElementById('policyResultsPassing').classList.remove('hidden')
            document.getElementById('policyResultsFailing').classList.add('hidden');
        } else {
            document.getElementById('policyResultsPassing').classList.add('hidden');
            document.getElementById('policyResultsFailing').classList.remove('hidden')
        }
        $('#policyResultsTable').bootstrapTable('load', this.rows);
    }

    static updateWithNewMitigations(mitigations) {
        this.mitigations = mitigations['policy-results'];

        this.applyMitigations();
    }

    static updateWithNewMitigation(mitigation) {
        this.mitigations[mitigation.id] = mitigation;

        this.applyMitigations();
    }

    static applyMitigations() {
        this.rows = this.rows.map((row) => {
            let mitigation = this.mitigations[row.id];
            if (!mitigation) {
                mitigation = VulnerabilitiesTable.getMitigationForPolicyFailure(row.source, row.msg);
            }
            if (!mitigation) {
                mitigation = SecretsTable.getMitigationForPolicyFailure(row.source, row.msg);
            }
            if (!mitigation) {
                mitigation = MisconfigurationsTable.getMitigationForPolicyFailure(row.source, row.msg);
            }
            if (mitigation) {
                row.mitigated = MITIGATED;
            }
            return row;
        });
        this.#updateUI();
    }
}