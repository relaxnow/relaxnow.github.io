class MisconfigurationsTable {
    static mitigations = {};
    static details = {};
    static rows = [];

    static {
        $('#misconfigurationsTable').bootstrapTable({
            pagination: true,
            search: true,
            sortSelectOptions: true,
            filterControl: true,
            sortName: 'severity',
            columns: [
                { field: 'id'           ,title: 'ID'           , visible: false},
                { field: 'severity'     ,title: 'Severity'     , sortable: true, filterControl: 'select', sorter: severitySorter},
                { field: 'target'       ,title: 'Target'       , sortable: true, filterControl: "input"},
                { field: 'ruleId'       ,title: 'Rule ID'      , sortable: true, filterControl: "select"},
                { field: 'title'        ,title: 'Title'        , sortable: true, filterControl: "input"}, 
                { field: 'provider'     ,title: 'Provider'     , sortable: true, filterControl: "select"},
                { field: 'mitigated'    ,title: 'Mitigated'    , sortable: true, filterControl: 'select'},
                { field: 'actions'          ,title: 'Actions'           , onClickRow: null, formatter: actionsFormatter, events: {
                    "click .mitigate": (e, value, row, index) => {
                        $('#mitigateForm').submit(function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            const formData = $(this).serializeArray();
                            MisconfigurationsTable.updateWithNewMitigation({
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
                const misconf = this.details[row.id];
                $('#modalData').html('<table>' + objToHtml(misconf) + '</table>')
                $('#detailsModal').modal('show')
            },
            data: []
        });
    }

    static updateWithNewResults(results) {
        this.rows = [];
        this.details = [];
        if (typeof results['configs'].Results !== 'undefined') {
            for (let i=0; i < results['configs'].Results.length; i++) {
                const result = results['configs'].Results[i];
                if (typeof result.Misconfigurations !== "undefined") {
                    for (let j=0; j < result.Misconfigurations.length; j++) {
                        const misconf = result.Misconfigurations[j];

                        misconf.Result = JSON.parse(JSON.stringify(result));
                        delete misconf.Result.Misconfigurations

                        const id = misconf.ID + '@' + misconf.Result.Target;
                        const mitigation = this.mitigations[id];

                        this.rows.push({
                            id      : id,
                            target  : misconf.Result.Target,
                            ruleId  : misconf.ID,
                            title   : misconf.Title,
                            provider: result.Type, 
                            severity: misconf.Severity,
                            mitigated: mitigation ? MITIGATED:NOT_MITIGATED
                        });

                        this.details[id] = misconf;
                    }
                }
            }
        }
        $('#misconfigurationsTable').bootstrapTable('load', this.rows);
    }

    static updateWithNewMitigations(mitigations) {
        this.mitigations = mitigations['configs'];

        this.#updateWithMitigations();
    }

    static updateWithNewMitigation(mitigation) {
        this.mitigations[mitigation.id];

        this.#updateWithMitigations();
    }

    static #updateWithMitigations() {
        this.rows = this.rows.map((row) => {
            const mitigation = this.mitigations[row.id];
            if (mitigation) {
                this.details[row.id].Mitigation = mitigation;
            }
            row.mitigated = mitigation ?  MITIGATED : NOT_MITIGATED;
            return row;
        });
        $('#misconfigurationsTable').bootstrapTable('load', this.rows);

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
        if (source !== "config.rego") {
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