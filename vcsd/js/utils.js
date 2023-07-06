function objToHtml(obj, stack = '') {
    let ret = '';
    for (let property in obj) {
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

function severitySorter(a, b) {
    const severities = [
        'Critical',
        'CRITICAL',
        'High',
        'HIGH',
        'Medium',
        'MEDIUM',
        'Low',
        'LOW',
        'Negligible',
        'NEGLIGIBLE',
        'Unknown',
        'UNKNOWN',
    ];
    return severities.indexOf(a) - severities.indexOf(b);
}

function actionsFormatter(value, row, index) {
    if (row.mitigated === "Mitigated") {
        return '';
    }
    if (typeof row.source !== "undefined" && ["config.rego","secret.rego","vulnerability.rego"].includes(row.source)) {
        return '';
    }
    return `<a class="mitigate" href="#" title="Mitigate"><i class="bi-bandaid"></i></a>`;
  }

function downloadObjectAsJson(exportObj, exportName){
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj, null, 4));
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", exportName + ".json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }