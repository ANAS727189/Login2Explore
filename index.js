$(document).ready(function () {
    const CONNECTION_TOKEN = "90934389|-31949226745166363|90957182";
    const BASE_URL = "http://api.login2explore.com:5577";
    const DB_NAME = "COLLEGE-DB";
    const RELATION_NAME = "PROJECT-TABLE";

    function initPage() {
        $("#projectId").focus();
        disableFormFields();
        setupEventListeners();
        loadLocalStorageData();
    }

    function setupEventListeners() {
        $("#projectId").on("blur", retrieveProjectData);
        $("#saveBtn").on("click", saveData);
        $("#updateBtn").on("click", updateData);
        $("#resetBtn").on("click", resetForm);
    }

    function loadLocalStorageData() {
        const projects = JSON.parse(localStorage.getItem('projects') || '{}');
        console.log('Loaded Projects:', projects);
    }

    function retrieveProjectData() {
        const projectId = $("#projectId").val().trim();
        if (!projectId) return;

        const projects = JSON.parse(localStorage.getItem('projects') || '{}');
        const localProject = projects[projectId];

        if (localProject) {
            populateForm(localProject);
            handleExistingRecord(localProject);
            return;
        }

        try {
            const getRequest = createGET_BY_KEYRequest(
                CONNECTION_TOKEN,
                DB_NAME,
                RELATION_NAME,
                JSON.stringify({ Project_ID: projectId })
            );

            jQuery.ajaxSetup({ async: false });
            const response = executeCommandAtGivenBaseUrl(
                getRequest,
                BASE_URL,
                "/api/irl"
            );
            jQuery.ajaxSetup({ async: true });

            if (response.status === 200) {
                const record = JSON.parse(response.data).record;
                saveToLocalStorage(record);
                populateForm(record);
                handleExistingRecord(record);
            } else {
                handleNewRecord();
            }
        } catch (error) {
            console.error("Error retrieving project data:", error);
            alert("Error retrieving project data. Please try again.");
        }
    }

    function saveToLocalStorage(record) {
        const projects = JSON.parse(localStorage.getItem('projects') || '{}');
        projects[record.Project_ID] = record;
        localStorage.setItem('projects', JSON.stringify(projects));
    }

    function populateForm(record) {
        $("#projectName").val(record.Project_Name);
        $("#assignedTo").val(record.Assigned_To);
        $("#assignmentDate").val(record.Assignment_Date);
        $("#deadline").val(record.Deadline);
    }

    function handleExistingRecord(record) {
        enableFormFields();
        localStorage.setItem("currentProjectId", record.Project_ID);
        $("#saveBtn").prop("disabled", true);
        $("#updateBtn").prop("disabled", false);
        $("#projectId").prop("disabled", true);
    }

    function handleNewRecord() {
        enableFormFields();
        $("#saveBtn").prop("disabled", false);
        $("#updateBtn").prop("disabled", true);
    }

    function saveData() {
        const formData = validateFormData();
        if (!formData) return;

        try {
            const jsonStrObj = JSON.stringify({
                Project_ID: formData.projectId,
                Project_Name: formData.projectName,
                Assigned_To: formData.assignedTo,
                Assignment_Date: formData.assignmentDate,
                Deadline: formData.deadline
            });

            const putRequest = createPUTRequest(
                CONNECTION_TOKEN,
                jsonStrObj,
                DB_NAME,
                RELATION_NAME
            );

            jQuery.ajaxSetup({ async: false });
            const response = executeCommandAtGivenBaseUrl(
                putRequest,
                BASE_URL,
                "/api/iml"
            );
            jQuery.ajaxSetup({ async: true });

            if (response.status === 200) {
                saveToLocalStorage(JSON.parse(jsonStrObj));
                handleServerResponse(response, "saved");
            } else {
                throw new Error(response.status + " - " + response.message);
            }
        } catch (error) {
            console.error("Error saving data:", error);
            alert("Error saving data: " + error.message);
            $('#saveBtn').prop('disabled', false);
        }
    }

    function updateData() {
        $('#updateBtn').prop('disabled', true);
        const formData = validateFormData();
        if (!formData) {
            $('#updateBtn').prop('disabled', false);
            return;
        }

        try {
            const jsonStrObj = JSON.stringify({
                Project_ID: formData.projectId,
                Project_Name: formData.projectName,
                Assigned_To: formData.assignedTo,
                Assignment_Date: formData.assignmentDate,
                Deadline: formData.deadline
            });

            const updateRequest = createUPDATERecordRequest(
                CONNECTION_TOKEN,
                jsonStrObj,
                DB_NAME,
                RELATION_NAME,
                localStorage.getItem("currentProjectId")
            );

            jQuery.ajaxSetup({ async: false });
            const response = executeCommandAtGivenBaseUrl(
                updateRequest,
                BASE_URL,
                "/api/iml"
            );
            jQuery.ajaxSetup({ async: true });

            if (response.status === 200) {
                saveToLocalStorage(JSON.parse(jsonStrObj));
                handleServerResponse(response, "updated");
            } else {
                throw new Error(response.status + " - " + response.message);
            }
        } catch (error) {
            console.error("Error updating data:", error);
            alert("Error updating data: " + error.message);
        } finally {
            $('#updateBtn').prop('disabled', false);
        }
    }

    function handleServerResponse(response, action) {
        if (response.status === 200) {
            alert(`Data successfully ${action}!`);
            resetForm();
        } else {
            alert(`Error ${action} record: ${response.message || 'Unknown error'}`);
            $('#saveBtn, #updateBtn').prop('disabled', false);
        }
    }

    function validateFormData() {
        const projectId = $("#projectId").val().trim();
        const projectName = $("#projectName").val().trim();
        const assignedTo = $("#assignedTo").val().trim();
        const assignmentDate = $("#assignmentDate").val().trim();
        const deadline = $("#deadline").val().trim();

        if (!projectId) {
            alert("Project ID is required.");
            $("#projectId").focus();
            return null;
        }

        if (!projectName) {
            alert("Project Name is required.");
            $("#projectName").focus();
            return null;
        }

        if (!assignedTo) {
            alert("Assigned To is required.");
            $("#assignedTo").focus();
            return null;
        }

        if (!assignmentDate) {
            alert("Assignment Date is required.");
            $("#assignmentDate").focus();
            return null;
        }

        if (!deadline) {
            alert("Deadline is required.");
            $("#deadline").focus();
            return null;
        }

        return {
            projectId,
            projectName,
            assignedTo,
            assignmentDate,
            deadline
        };
    }

    function enableFormFields() {
        $("#projectName, #assignedTo, #assignmentDate, #deadline")
            .prop("disabled", false);
    }

    function disableFormFields() {
        $("#projectName, #assignedTo, #assignmentDate, #deadline")
            .prop("disabled", true);
        $("#saveBtn, #updateBtn").prop("disabled", true);
    }

    function resetForm() {
        $("#projectForm")[0].reset();
        localStorage.removeItem("currentProjectId");
        $("#projectId").prop("disabled", false).focus();
        disableFormFields();
    }

    initPage();
});