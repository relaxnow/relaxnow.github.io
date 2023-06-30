// $.getJSON("test.json", function(data) {
//     processData(data);
// });

document.getElementById('file').addEventListener('change', onChange);

$('#policyResultsTable').bootstrapTable({
    pagination: true,
    search: true,
    sortSelectOptions: true,
    filterControl: true,
    columns: [
        { field: 'source'   ,title: 'Source', filterControl: 'select'}, 
        { field: 'msg'      ,title: 'Message',filterControl: 'input'},
    ],
    data: []
});

let vulnerabilities = [];
$('#vulnerabilitiesTable').bootstrapTable({
    pagination: true,
    search: true,
    sortSelectOptions: true,
    filterControl: true,
    sortName: 'severity',
    columns: [
        { field: 'id'           ,title: 'Number'},
        { field: 'name'         ,title: 'Source'        , sortable: true, filterControl: "input"}, 
        { field: 'installed'    ,title: 'Message'       , sortable: true},
        { field: 'fixedin'      ,title: 'Fixed-in'      , sortable: true},
        { field: 'type'         ,title: 'Type'          , sortable: true, filterControl: "select"},
        { field: 'vulnerability',title: 'Vulnerability' , sortable: true, },
        { field: 'severity'     ,title: 'Severity'      , sortable: true, filterControl: 'select'},
    ],
    onClickRow: function (row) {
        const match = vulnerabilities['matches'][row.id-1];
        $('#modalData').html('<table>' + objToHtml(match) + '</table>')
        $('#detailsModal').modal('show')
    },
    data: []
});

let misconfigurations = [];
$('#misconfigurationsTable').bootstrapTable({
    pagination: true,
    search: true,
    sortSelectOptions: true,
    filterControl: true,
    sortName: 'severity',
    columns: [
        { field: 'nr'           ,title: 'Number'},
        { field: 'title'        ,title: 'Title'        , sortable: true, filterControl: "input"}, 
        { field: 'provider'     ,title: 'Provider'     , sortable: true, filterControl: "select"},
        { field: 'id'           ,title: 'ID'            , sortable: true},
        { field: 'severity'     ,title: 'Severity'      , sortable: true, filterControl: 'select'},
    ],
    onClickRow: function (row) {
        const misconf = misconfigurations[row.nr-1];
        $('#modalData').html('<table>' + objToHtml(misconf) + '</table>')
        $('#detailsModal').modal('show')
    },
    data: []
});

let secrets = [];
$('#secretsTable').bootstrapTable({
    pagination: true,
    search: true,
    sortSelectOptions: true,
    filterControl: true,
    sortName: 'severity',
    columns: [
        { field: 'nr'           ,title: 'Number'},
        { field: 'file'        ,title: 'File'        , sortable: true, filterControl: "input"}, 
        { field: 'secretType'     ,title: 'Secret Type'     , sortable: true, filterControl: "select"},
        { field: 'severity'     ,title: 'Severity'      , sortable: true, filterControl: 'select'},
    ],
    onClickRow: function (row) {
        const secret = secrets[row.nr-1];
        $('#modalData').html('<table>' + objToHtml(secret) + '</table>')
        $('#detailsModal').modal('show')
    },
    data: []
});

function onChange(event) {
    var reader = new FileReader();
    reader.onload = onReaderLoad;
    reader.readAsText(event.target.files[0]);
}

function onReaderLoad(evt){
    var input = evt.target.result;
    var data = JSON.parse(input);
    if (!data || typeof data["policy-results"] === "undefined") {
        alert("Missing 'policy-results' not a Container Security Result?")
        return;
    }
    processData(data);
}

function processData(data) {
    console.log(data);
    buildPolicyResults(data);
    buildVulnerabilitiesTable(data);
    buildMisconfigurationsTable(data);
    buildSecretsTable(data);
    // enable navigation
    $(".nav-link.disabled").removeClass("disabled");
    // show upload success alert
    const uploadSuccessEl = document.getElementById('uploadSuccess');
    uploadSuccessEl.classList.remove('hidden');
    setTimeout(() => uploadSuccessEl.classList.add('hidden'), 15000);
}

function buildPolicyResults(data) {
    if (data['policy-passed']) {
        document.getElementById('policyResultsPassing').classList.remove('hidden')
        document.getElementById('policyResultsFailing').classList.add('hidden');
    } else {
        document.getElementById('policyResultsPassing').classList.add('hidden');
        document.getElementById('policyResultsFailing').classList.remove('hidden')
    }
    if (typeof data['policy-results'][0]['failures'] === "undefined") {
        data['policy-results'][0]['failures'] = [];
    }
    const tableData = data['policy-results'][0]['failures'].map((value) => {
        return {
            source: value.msg.split(" ")[0],
            msg: value.msg
        };
    });
    $('#policyResultsTable').bootstrapTable('load', tableData);
}

function buildVulnerabilitiesTable(data) {
    const tableData = data['vulnerabilities']['matches'].map((match, index) => {
        return {
            id              : index+1,
            name            : match.artifact.name,
            installed       : match.artifact.version,
            fixedin         : match.vulnerability.fix.versions[0],
            type            : match.artifact.type,
            vulnerability   : match.vulnerability.id,
            severity        : match.vulnerability.severity,
        };
    });
    vulnerabilities = data['vulnerabilities'];
    $('#vulnerabilitiesTable').bootstrapTable('load', tableData);
}

function buildMisconfigurationsTable(data) {
    let tableData = [];
    misconfigurations = [];
    if (typeof data['configs'].Results !== 'undefined') {
        for (let i=0; i < data['configs'].Results.length; i++) {
            const result = data['configs'].Results[i];
            for (let j=0; j < result.Misconfigurations.length; j++) {
                const misconf = result.Misconfigurations[j];
                tableData.push({
                    nr      : misconfigurations.length+1,
                    title   : misconf.Title,
                    provider: result.Type, 
                    id      : misconf.ID,
                    severity: misconf.Severity
                });

                misconf.Result = JSON.parse(JSON.stringify(result));
                delete misconf.Result.Misconfigurations
                misconfigurations.push(misconf);
            }
        }
    }
    $('#misconfigurationsTable').bootstrapTable('load', tableData);
}

function buildSecretsTable(data) {
    let tableData = [];
    secrets = [];
    if (typeof data['secrets'].Results !== 'undefined') {
        for (let i=0; i < data['secrets'].Results.length; i++) {
            const result = data['secrets'].Results[i];
            for (let j=0; j < result.Secrets.length; j++) {
                const secret = result.Secrets[j];
                tableData.push({
                    nr          : secrets.length+1,
                    file        : result.Target,
                    secretType  : secret.Title,
                    severity    : secret.Severity
                });

                secret.Result = JSON.parse(JSON.stringify(result));
                delete secret.Result.Secrets
                secrets.push(secret);
            }
        }
    }
    $('#secretsTable').bootstrapTable('load', tableData);
}

function objToHtml(obj, stack = '') {
    let ret = '';
    for (var property in obj) {
        if (obj.hasOwnProperty(property)) {
            if (typeof obj[property] == "object") {
                ret += objToHtml(obj[property], (stack === "" ? "" : stack + ".") + property);
            } else {
                let value = obj[property];
                let escapedValue = escapeHtml(value);
                if (typeof value === "string" && value.startsWith('http')) {
                    escapedValue = `<a href="${escapedValue}" target="_blank">${escapedValue}</a>`;
                }
                ret += '<tr><td>' + (stack === "" ? "" : escapeHtml(stack) + ".") + escapeHtml(property) + "</td><td>" + escapedValue + '</td></tr>';
            }
        }
    }
    return ret;
}

function escapeHtml(value) {
    const p = document.createElement('p'); 
    $(p).text(value); 
    return $(p).html();
}