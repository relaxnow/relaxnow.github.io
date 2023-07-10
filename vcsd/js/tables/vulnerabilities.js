class VulnerabilitiesTable {
    static mitigations = {};
    static details = [];
    static rows = [];

    static {
        $('#vulnerabilitiesTable').bootstrapTable({
            pagination: true,
            search: true,
            sortSelectOptions: true,
            filterControl: true,
            sortName: 'severity',
            clickToSelect: true,
            columns: [
                { field: 'id'               ,title: 'ID'                , visible: false},
                { field: 'severity'         ,title: 'Severity'          , sortable: true, filterControl: 'select', sorter: severitySorter},
                { field: 'name'             ,title: 'Source'            , sortable: true, filterControl: "input"},
                { field: 'vulnerability'    ,title: 'Vulnerability'     , sortable: true, filterControl: "input"},
                { field: 'installed'        ,title: 'Installed version' , sortable: true},
                { field: 'fixstate'         ,title: 'Fix state'         , sortable: true, filterControl: "select"},
                { field: 'artifactType'     ,title: 'Type'              , sortable: true, filterControl: "select"},
                { field: 'mitigated'        ,title: 'Mitigated'         , sortable: true, filterControl: 'select'},
                { field: 'actions'          ,title: 'Actions'           , onClickRow: null, formatter: actionsFormatter, events: {
                    "click .mitigate": (e, value, row, index) => {
                        $('#mitigateForm').submit(function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            const formData = $(this).serializeArray();
                            VulnerabilitiesTable.updateWithNewMitigation({
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
                const match = this.details[row.id];
                const artifactHtml     = '<h3>Artifact</h3>     <table>' + objToHtml(match.artifact)     + '</table>';
                const vulnerabilityHtml= '<h3>Vulnerability</h3><table>' + objToHtml(match.vulnerability)+ '</table>';
                const matchDetailsHtml = '<h3>Match details</h3><table>' + objToHtml(match.matchDetails) + '</table>';
                let relatedVulnerabilitiesHtml = '';
                if (match.relatedVulnerabilities.length > 0) {
                    relatedVulnerabilitiesHtml = '<h3>Related Vulnerabilities</h3><table>' + objToHtml(match.relatedVulnerabilities) + '</table>';
                }
                let mitigatedHtml = '';
                if (typeof match.Mitigation !== "undefined") {
                    mitigatedHtml = '<h3>Mitigation</h3><table>' + objToHtml(match.Mitigation) + '</table>';
                }
                $('#modalData').html(mitigatedHtml + artifactHtml + vulnerabilityHtml + relatedVulnerabilitiesHtml + matchDetailsHtml);
                $('#detailsModal').modal('show')
            },
            data: []
        });
    }

    static updateWithNewResults(results) {
        this.details = {};
        this.rows = results['vulnerabilities']['matches'].map((match) => {
            const id = match.vulnerability.id + '@' + match.artifact.purl;
            const mitigation = this.mitigations[id];
            match.Mitigation = mitigation;
            this.details[id] = match;
            return {
                id              : id,
                name            : match.artifact.name,
                installed       : match.artifact.version,
                fixstate        : match.vulnerability.fix.state,
                artifactType    : match.artifact.type,
                vulnerability   : match.vulnerability.id,
                severity        : match.vulnerability.severity,
                mitigated       : mitigation ? MITIGATED : NOT_MITIGATED
            };
        });
        $('#vulnerabilitiesTable').bootstrapTable('load', this.rows);
    }

    static updateWithNewMitigations(mitigations) {
        this.mitigations = mitigations.vulnerabilities;
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
            row.mitigated = mitigation ? MITIGATED : NOT_MITIGATED;
            return row;
        });
        $('#vulnerabilitiesTable').bootstrapTable('load', this.rows);

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
        if (source !== "vulnerability.rego") {
            return;
        }
        const regex = /: ([\w-]+)/;
        const found = msg.match(regex);
        if (found.length < 2) {
            return;
        }
        const vulnerabilityId = found[1];
        const keys = Object.keys(this.details);
        for (let i=0; i<keys.length; i++) {
            const key = keys[i];
            const splitKey = key.split('@');

            if (vulnerabilityId === splitKey[0]) {
                return key;
            }
        }
    }
}