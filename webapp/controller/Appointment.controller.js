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

            // Check for overlapping appointments
            var aAppointments = oModel.getProperty("/appointments") || [];
            var bConflict = aAppointments.some(function(appt) {
                if (appt.id === oDraft.id) return false; // Skip self when rescheduling
                return appt.advisorId === oDraft.advisorId && appt.date === oDraft.date &&
                    this._timesOverlap(appt.time, appt.duration, oDraft.time, oDraft.duration);
            }.bind(this));
            if (bConflict) {
                MessageBox.error(this.getResourceBundle().getText("conflictError"));
                return;
            }

            // Resolve advisor name
            var aAdvisors = oModel.getProperty("/advisors") || [];
            var oAdvisor = aAdvisors.find(function(a){ return a.id === oDraft.advisorId; });
            oDraft.advisorName = oAdvisor ? oAdvisor.name : oDraft.advisorId;

            var bIsReschedule = !!oDraft.id;
            if (bIsReschedule) {
                // Update existing
                var iIndex = aAppointments.findIndex(function(a){ return a.id === oDraft.id; });
                if (iIndex >= 0) {
                    aAppointments[iIndex] = oDraft;
                }
            } else {
                // Generate id for new
                oDraft.id = "APT-" + Math.floor(1000 + Math.random() * 9000);
                aAppointments.push(oDraft);
            }
            oModel.setProperty("/appointments", aAppointments);

            // Reset draft
            oModel.setProperty("/draft", {
                id: null,
                studentName: "",
                studentId: "",
                advisorId: "",
                date: null,
                time: "",
                duration: 30,
                notes: "",
                isRescheduleMode: false
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

        onRescheduleAppointment: function(oEvent) {
            var oModel = this._appointmentsModel;
            var oItem = oEvent.getSource().getParent().getParent();
            var sPath = oItem.getBindingContext("appointments").getPath();
            var oAppt = oModel.getProperty(sPath);
            
            // Populate draft with existing appointment data
            oAppt = JSON.parse(JSON.stringify(oAppt));
            oAppt.isRescheduleMode = true;
            oModel.setProperty("/draft", oAppt);
            this._updateFilteredSlots();
            
            MessageToast.show(this.getResourceBundle().getText("rescheduleMode"));
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

            // Remove slots that overlap with existing bookings
            var aAppointments = oModel.getProperty("/appointments") || [];
            var sDraftId = oModel.getProperty("/draft/id");
            var aFiltered = aSlotsForDay.filter(function(slot) {
                return !aAppointments.some(function(appt) {
                    if (appt.id === sDraftId) return false; // Allow rescheduling to same slot
                    if (appt.advisorId !== sAdvisorId || appt.date !== sDate) return false;
                    var iDraftDuration = oModel.getProperty("/draft/duration") || 30;
                    return this._timesOverlap(appt.time, appt.duration || 30, slot, iDraftDuration);
                }.bind(this));
            }.bind(this));
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

        _timesOverlap: function(time1, duration1, time2, duration2) {
            // Parse HH:MM and convert to minutes since midnight
            var toMinutes = function(sTime) {
                var parts = sTime.split(":");
                return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
            };
            var start1 = toMinutes(time1);
            var end1 = start1 + parseInt(duration1, 10);
            var start2 = toMinutes(time2);
            var end2 = start2 + parseInt(duration2, 10);
            return (start1 < end2 && end1 > start2);
        },

        getResourceBundle: function() {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        }
    });
});
