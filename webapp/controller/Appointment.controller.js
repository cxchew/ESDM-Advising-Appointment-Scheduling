sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function(Controller, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("project1.controller.Appointment", {
        onInit: function() {
            this._appointmentsModel = this.getOwnerComponent().getModel("appointments");
            // Initialize filtered slots
            this._updateFilteredSlots();
        },

        onRefresh: function() {
            var sUrl = sap.ui.require.toUrl("project1/model/appointments.json");
            this._appointmentsModel.loadData(sUrl);
            MessageToast.show(this.getResourceBundle().getText("refreshed"));
        },

        onCreateAppointment: function() {
            var oModel = this._appointmentsModel;
            var oDraft = JSON.parse(JSON.stringify(oModel.getProperty("/draft")));

            // Basic validation
            if (!oDraft.studentName || !oDraft.studentId || !oDraft.advisorId || !oDraft.date || !oDraft.time) {
                MessageBox.error(this.getResourceBundle().getText("validationError"));
                return;
            }

            // Resolve advisor name
            var aAdvisors = oModel.getProperty("/advisors") || [];
            var oAdvisor = aAdvisors.find(function(a){ return a.id === oDraft.advisorId; });
            oDraft.advisorName = oAdvisor ? oAdvisor.name : oDraft.advisorId;

            // Generate id
            oDraft.id = "APT-" + Math.floor(1000 + Math.random() * 9000);

            // Append to appointments
            var aAppointments = oModel.getProperty("/appointments") || [];
            aAppointments.push(oDraft);
            oModel.setProperty("/appointments", aAppointments);

            // Reset draft
            oModel.setProperty("/draft", {
                studentName: "",
                studentId: "",
                advisorId: "",
                date: null,
                time: "",
                notes: ""
            });

            MessageToast.show(this.getResourceBundle().getText("created"));
        },

        onCancelAppointment: function(oEvent) {
            var oModel = this._appointmentsModel;
            var oItem = oEvent.getSource().getParent().getParent(); // Button -> HBox -> ColumnListItem
            var sPath = oItem.getBindingContext("appointments").getPath();
            var iIndex = parseInt(sPath.split("/").pop(), 10);
            var aAppointments = oModel.getProperty("/appointments");

            MessageBox.confirm(this.getResourceBundle().getText("confirmCancel"), {
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                onClose: function(oAction){
                    if (oAction === MessageBox.Action.YES) {
                        aAppointments.splice(iIndex, 1);
                        oModel.setProperty("/appointments", aAppointments);
                        MessageToast.show(this.getResourceBundle().getText("cancelled"));
                    }
                }.bind(this)
            });
        },

        onStudentChange: function(oEvent) {
            var sStudentId = oEvent.getSource().getSelectedKey();
            var oModel = this._appointmentsModel;
            var aStudents = oModel.getProperty("/students") || [];
            var oStudent = aStudents.find(function(s){ return s.id === sStudentId; });
            if (oStudent) {
                oModel.setProperty("/draft/studentId", oStudent.id);
                oModel.setProperty("/draft/studentName", oStudent.name);
                oModel.setProperty("/draft/advisorId", oStudent.advisorId);
            }
            this._updateFilteredSlots();
        },

        onAdvisorChange: function() {
            this._updateFilteredSlots();
        },

        onDateChange: function() {
            this._updateFilteredSlots();
        },

        _updateFilteredSlots: function() {
            var oModel = this._appointmentsModel;
            var sAdvisorId = oModel.getProperty("/draft/advisorId");
            var sDate = oModel.getProperty("/draft/date");
            if (!sAdvisorId || !sDate) {
                oModel.setProperty("/filteredSlots", []);
                return;
            }
            var oDate = this._parseDate(sDate);
            var iDay = oDate.getDay(); // 0..6
            var oAvail = oModel.getProperty("/availability") || {};
            var mAdvisor = oAvail[sAdvisorId] || {};
            var aSlotsForDay = mAdvisor[String(iDay)] || [];

            // Remove already booked slots for advisor on the selected date
            var aAppointments = oModel.getProperty("/appointments") || [];
            var aBookedTimes = aAppointments
                .filter(function(a){ return a.advisorId === sAdvisorId && a.date === sDate; })
                .map(function(a){ return a.time; });
            var aFiltered = aSlotsForDay.filter(function(t){ return aBookedTimes.indexOf(t) === -1; });
            oModel.setProperty("/filteredSlots", aFiltered);
        },

        _parseDate: function(sDate) {
            // Expect yyyy-MM-dd
            var parts = (sDate || "").split("-");
            var y = parseInt(parts[0], 10);
            var m = parseInt(parts[1], 10) - 1;
            var d = parseInt(parts[2], 10);
            return new Date(y, m, d);
        },

        getResourceBundle: function() {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        }
    });
});
