class SecretsTable {
    static mitigations = {};
    static details = {};
    static rows = [];

    static {
        $('#secretsTable').bootstrapTable({
            pagination: true,
            search: true,
            sortSelectOptions: true,
            filterControl: true,
            sortName: 'severity',
            columns: [
                { field: 'id'          ,title: 'ID', visible: false},
                { field: 'file'        ,title: 'File'           , sortable: true, filterControl: "input"}, 
                { field: 'secretType'  ,title: 'Secret Type'    , sortable: true, filterControl: "select"},
                { field: 'severity'    ,title: 'Severity'       , sortable: true, filterControl: 'select', sorter: severitySorter},
                { field: 'mitigated'   ,title: 'Mitigated'      , sortable: true, filterControl: 'select'},
                { field: 'actions'          ,title: 'Actions'           , onClickRow: null, formatter: actionsFormatter, events: {
                    "click .mitigate": (e, value, row, index) => {
                        $('#mitigateForm').submit(function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            const formData = $(this).serializeArray();
                            SecretsTable.updateWithNewMitigation({
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
            onClickRow: (row) => {
                const secret = this.details[row.id];
                $('#modalData').html('<table>' + objToHtml(secret) + '</table>')
                $('#detailsModal').modal('show')
            },
            data: []
        });
    }

    static updateWithNewResults(results) {
        this.rows = [];
        this.details = {};
        if (typeof results['secrets'].Results !== 'undefined') {
            for (let i=0; i < results['secrets'].Results.length; i++) {
                const result = results['secrets'].Results[i];
                for (let j=0; j < result.Secrets.length; j++) {
                    const secret = result.Secrets[j];
                    secret.Result = JSON.parse(JSON.stringify(result));
                    delete secret.Result.Secrets
                    const id = secret.Category + '@' + secret.Result.Target;
                    const mitigation = this.mitigations[id];
                    secret.Mitigation = mitigation;
                    
                    this.rows.push({
                        id          : id,
                        file        : result.Target,
                        secretType  : secret.Title,
                        severity    : secret.Severity,
                        mitigated   : mitigation ? 'Mitigated' : 'Not mitigated'
                    });     
                    this.details[id] = secret;
                }
            }
        }
        $('#secretsTable').bootstrapTable('load', this.rows);
    }

    static updateWithNewMitigations(mitigations) {
        this.mitigations = mitigations.secrets;

        this.#updateWithNewMitigations();
    }

    static updateWithNewMitigation(mitigation) {
        this.mitigations[mitigation.id] = mitigation;

        this.#updateWithNewMitigations();
    }

    static #updateWithNewMitigations() {
        this.rows = this.rows.map((row) => {
            const mitigation = this.mitigations[row.id];
            if (mitigation) {
                this.details[row.id].Mitigation = mitigation;
            }
            row.mitigated = mitigation ?  MITIGATED: NOT_MITIGATED;
            return row;
        });
        $('#secretsTable').bootstrapTable('load', this.rows);

        PolicyResultsTable.applyMitigations();
    }

    static getMitigationForPolicyFailure(source, msg) {
        const id = this.#getIdFromPolicyFailure(source, msg);

        if (!id) {
            return;
        }

        return this.mitigations[id];
    }

    static #getIdFromPolicyFailure(source, msg) {
        if (source !== "secret.rego") {
            return;
        }
        const splitMsg = msg.split(":");
        if (splitMsg.length < 3) {
            return;
        }
        const target = splitMsg[1].trim();
        const title = splitMsg[2].trim();

        for (const key in this.details) {
            const detail = this.details[key];
            if (detail.Title === title && detail.Result.Target === target) {
                return key;
            }
        }
    }
}