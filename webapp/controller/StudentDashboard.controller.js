sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function(Controller, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("project1.controller.StudentDashboard", {
        onInit: function() {
            this._appointmentsModel = this.getOwnerComponent().getModel("appointments");
            
            // Initialize student booking data
            var oModel = this._appointmentsModel;
            oModel.setProperty("/currentStudentId", "");
            oModel.setProperty("/currentAdvisorName", "");
            oModel.setProperty("/availableSlots", []);
            oModel.setProperty("/myAppointments", []);
            oModel.setProperty("/studentBooking", {
                date: null,
                time: "",
                duration: 60,
                notes: ""
            });
        },

        onCurrentStudentChange: function(oEvent) {
            var sStudentId = oEvent.getSource().getSelectedKey();
            var oModel = this._appointmentsModel;
            var aStudents = oModel.getProperty("/students") || [];
            var oStudent = aStudents.find(function(s){ return s.id === sStudentId; });
            
            if (oStudent) {
                oModel.setProperty("/currentStudentId", oStudent.id);
                
                // Get advisor name
                var aAdvisors = oModel.getProperty("/advisors") || [];
                var oAdvisor = aAdvisors.find(function(a){ return a.id === oStudent.advisorId; });
                oModel.setProperty("/currentAdvisorName", oAdvisor ? oAdvisor.name : "");
                
                // Load student's appointments
                this._loadMyAppointments(oStudent.id);
                
                // Reset booking form
                oModel.setProperty("/studentBooking", {
                    date: null,
                    time: "",
                    duration: 60,
                    notes: ""
                });
                oModel.setProperty("/availableSlots", []);
            }
        },

        onStudentDateChange: function() {
            this._updateAvailableSlots();
        },

        _updateAvailableSlots: function() {
            var oModel = this._appointmentsModel;
            var sStudentId = oModel.getProperty("/currentStudentId");
            var sDate = oModel.getProperty("/studentBooking/date");
            
            if (!sStudentId || !sDate) {
                oModel.setProperty("/availableSlots", []);
                return;
            }

            // Get student's advisor
            var aStudents = oModel.getProperty("/students") || [];
            var oStudent = aStudents.find(function(s){ return s.id === sStudentId; });
            if (!oStudent) {
                oModel.setProperty("/availableSlots", []);
                return;
            }

            var sAdvisorId = oStudent.advisorId;
            var oDate = this._parseDate(sDate);
            var iDay = oDate.getDay();
            
            // Get advisor's availability for this day
            var oAvail = oModel.getProperty("/availability") || {};
            var mAdvisor = oAvail[sAdvisorId] || {};
            var aSlotsForDay = mAdvisor[String(iDay)] || [];

            // Filter out booked slots
            var aAppointments = oModel.getProperty("/appointments") || [];
            var iDuration = oModel.getProperty("/studentBooking/duration") || 60;
            var aFiltered = aSlotsForDay.filter(function(slot) {
                return !aAppointments.some(function(appt) {
                    if (appt.advisorId !== sAdvisorId || appt.date !== sDate) return false;
                    return this._timesOverlap(appt.time, appt.duration || 60, slot, iDuration);
                }.bind(this));
            }.bind(this));

            oModel.setProperty("/availableSlots", aFiltered);
        },

        onStudentBookAppointment: function() {
            var oModel = this._appointmentsModel;
            var sStudentId = oModel.getProperty("/currentStudentId");
            var oBooking = oModel.getProperty("/studentBooking");
            
            if (!sStudentId) {
                MessageBox.error(this.getResourceBundle().getText("selectStudentFirst"));
                return;
            }

            if (!oBooking.date || !oBooking.time) {
                MessageBox.error(this.getResourceBundle().getText("validationError"));
                return;
            }

            // Get student info
            var aStudents = oModel.getProperty("/students") || [];
            var oStudent = aStudents.find(function(s){ return s.id === sStudentId; });
            if (!oStudent) return;

            // Get advisor info
            var aAdvisors = oModel.getProperty("/advisors") || [];
            var oAdvisor = aAdvisors.find(function(a){ return a.id === oStudent.advisorId; });

            // Check for conflicts
            var aAppointments = oModel.getProperty("/appointments") || [];
            var bConflict = aAppointments.some(function(appt) {
                return appt.advisorId === oStudent.advisorId && appt.date === oBooking.date &&
                    this._timesOverlap(appt.time, appt.duration, oBooking.time, oBooking.duration);
            }.bind(this));

            if (bConflict) {
                MessageBox.error(this.getResourceBundle().getText("conflictError"));
                return;
            }

            // Create new appointment
            var oNewAppt = {
                id: "APT-" + Math.floor(1000 + Math.random() * 9000),
                studentName: oStudent.name,
                studentId: oStudent.id,
                advisorId: oStudent.advisorId,
                advisorName: oAdvisor ? oAdvisor.name : oStudent.advisorId,
                date: oBooking.date,
                time: oBooking.time,
                duration: oBooking.duration,
                notes: oBooking.notes
            };

            aAppointments.push(oNewAppt);
            oModel.setProperty("/appointments", aAppointments);

            // Reset form
            oModel.setProperty("/studentBooking", {
                date: null,
                time: "",
                duration: 60,
                notes: ""
            });
            oModel.setProperty("/availableSlots", []);

            // Refresh my appointments
            this._loadMyAppointments(sStudentId);

            MessageToast.show(this.getResourceBundle().getText("appointmentBooked"));
        },

        onStudentCancelAppointment: function(oEvent) {
            var oModel = this._appointmentsModel;
            var oItem = oEvent.getSource().getParent().getParent();
            var sPath = oItem.getBindingContext("appointments").getPath();
            var oAppt = oModel.getProperty(sPath);
            
            MessageBox.confirm(this.getResourceBundle().getText("confirmCancel"), {
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                onClose: function(oAction){
                    if (oAction === MessageBox.Action.YES) {
                        var aAppointments = oModel.getProperty("/appointments");
                        var iIndex = aAppointments.findIndex(function(a){ return a.id === oAppt.id; });
                        if (iIndex >= 0) {
                            aAppointments.splice(iIndex, 1);
                            oModel.setProperty("/appointments", aAppointments);
                            this._loadMyAppointments(oModel.getProperty("/currentStudentId"));
                            MessageToast.show(this.getResourceBundle().getText("cancelled"));
                        }
                    }
                }.bind(this)
            });
        },

        _loadMyAppointments: function(sStudentId) {
            var oModel = this._appointmentsModel;
            var aAppointments = oModel.getProperty("/appointments") || [];
            var aMyAppts = aAppointments.filter(function(a){ return a.studentId === sStudentId; });
            oModel.setProperty("/myAppointments", aMyAppts);
        },

        _parseDate: function(sDate) {
            var parts = (sDate || "").split("-");
            var y = parseInt(parts[0], 10);
            var m = parseInt(parts[1], 10) - 1;
            var d = parseInt(parts[2], 10);
            return new Date(y, m, d);
        },

        _timesOverlap: function(time1, duration1, time2, duration2) {
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
