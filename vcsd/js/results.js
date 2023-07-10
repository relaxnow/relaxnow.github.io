$.getJSON("results.json", function(data) {
    processResults(data);
});

document.getElementById('resultsFile').addEventListener('change', (event) => {
    let reader = new FileReader();
    reader.onload = (evt) => {
        let input = evt.target.result;
        let data = {};
        try {
            data = JSON.parse(input);
        } catch (e) {
            alert("File does not parse as JSON. Not Container Security Result.");
            return;
        }
        if (!data || typeof data["policy-results"] === "undefined") {
            alert("Missing 'policy-results' not a Container Security Result.")
            return;
        }
        processResults(data);
    };
    reader.readAsText(event.target.files[0]);
});

function processResults(results) {
    console.log(results);

    VulnerabilitiesTable.updateWithNewResults(results);
    MisconfigurationsTable.updateWithNewResults(results);
    SecretsTable.updateWithNewResults(results);

    PolicyResultsTable.updateWithNewResults(results);

    // enable navigation
    $(".nav-link.disabled").removeClass("disabled");
    
    // show upload success alert
    const uploadSuccessEl = document.getElementById('uploadResultsSuccess');
    uploadSuccessEl.classList.remove('hidden');
    setTimeout(() => uploadSuccessEl.classList.add('hidden'), 15000);
}