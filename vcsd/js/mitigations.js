// $.getJSON("mitigations.json", function(data) {
//     processMitigations(data);
// });

const MITIGATION_IDENTIFIER_TYPE = "veracode-container-security-display.mitigations.v1.json";
const MITIGATED = "Mitigated";
const NOT_MITIGATED = "Not mitigated";

document.getElementById('mitigationsFile').addEventListener('change', (event) => {
    let reader = new FileReader();
    reader.onload = (evt) => {
        let input = evt.target.result;
        let data = {};
        try {
            data = JSON.parse(input);
        } catch (e) {
            alert("File does not parse as JSON. Not Container Security Mitigations.");
            return;
        }
        if (!data || typeof data["type"] === "undefined") {
            alert("Missing 'policy-results' not a Container Security Mitigations.")
            return;
        }
        if (data.type !== MITIGATION_IDENTIFIER_TYPE) {
            alert("Incorrect 'type' not a Container Security Mitigations.")
            return;
        }

        processMitigations(data);
    };
    reader.readAsText(event.target.files[0]);
});

function processMitigations(mitigations) {
    console.log(mitigations);

    PolicyResultsTable.updateWithNewMitigations(mitigations);
    VulnerabilitiesTable.updateWithNewMitigations(mitigations);
    MisconfigurationsTable.updateWithNewMitigations(mitigations);
    SecretsTable.updateWithNewMitigations(mitigations);

    // enable navigation
    $(".nav-link.disabled").removeClass("disabled");
    
    // show upload success alert
    const uploadSuccessEl = document.getElementById('uploadMitigationsSuccess');
    uploadSuccessEl.classList.remove('hidden');
    setTimeout(() => uploadSuccessEl.classList.add('hidden'), 15000);
}

document.getElementById('downloadMitigations').addEventListener('click', (event) => {
    downloadObjectAsJson({
        "type": MITIGATION_IDENTIFIER_TYPE,
        "vulnerabilities": VulnerabilitiesTable.mitigations,
        "configs": MisconfigurationsTable.mitigations,
        "policy-results": PolicyResultsTable.mitigations,
        "secrets": SecretsTable.mitigations
    }, "veracode-vcsd-mitigations");
});