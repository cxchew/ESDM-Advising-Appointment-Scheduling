sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function(Controller, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("project1.controller.StudentDashboard", {
        onInit: function() {
            this._appointmentsModel = this.getOwnerComponent().getModel("appointments");
            this._loadStudentInfo();
            this._loadFreeSlots();
        },

        _loadStudentInfo: function() {
            var oModel = this._appointmentsModel;
            var sStudentId = oModel.getProperty("/loggedInStudentId");
            var aStudents = oModel.getProperty("/students") || [];
            var oStudent = aStudents.find(function(s) { return s.id === sStudentId; });
            
            if (oStudent) {
                oModel.setProperty("/currentStudentId", oStudent.id);
                oModel.setProperty("/currentStudentName", oStudent.name);
                
                var aAdvisors = oModel.getProperty("/advisors") || [];
                var oAdvisor = aAdvisors.find(function(a) { return a.id === oStudent.advisorId; });
                oModel.setProperty("/currentAdvisorName", oAdvisor ? oAdvisor.name : "");
                oModel.setProperty("/currentAdvisorId", oStudent.advisorId);
                
                this._loadMyBookedSlots(sStudentId);
            }
        },

        _loadFreeSlots: function() {
            var oModel = this._appointmentsModel;
            var sAdvisorId = oModel.getProperty("/currentAdvisorId");
            var aAllSlots = oModel.getProperty("/availabilitySlots") || [];
            
            // Filter free slots for this advisor
            var aFree = aAllSlots.filter(function(slot) {
                return slot.advisorId === sAdvisorId && slot.status === "free";
            });
            
            oModel.setProperty("/freeSlots", aFree);
        },

        _loadMyBookedSlots: function(sStudentId) {
            var oModel = this._appointmentsModel;
            var aAllSlots = oModel.getProperty("/availabilitySlots") || [];
            
            // Filter booked slots for this student
            var aBooked = aAllSlots.filter(function(slot) {
                return slot.bookedBy === sStudentId;
            });
            
            oModel.setProperty("/myBookedSlots", aBooked);
        },

        onBookSlot: function(oEvent) {
            var oModel = this._appointmentsModel;
            var oItem = oEvent.getSource().getParent().getParent();
            var sPath = oItem.getBindingContext("appointments").getPath();
            var oSlot = oModel.getProperty(sPath);
            
            if (oSlot.status !== "free") {
                MessageBox.error(this.getResourceBundle().getText("slotAlreadyBooked"));
                return;
            }

            var sStudentId = oModel.getProperty("/currentStudentId");
            var sStudentName = oModel.getProperty("/currentStudentName");
            
            // Update slot
            oSlot.status = "booked";
            oSlot.bookedBy = sStudentId;
            oSlot.studentName = sStudentName;
            
            var aSlots = oModel.getProperty("/availabilitySlots");
            var iIndex = aSlots.findIndex(function(s) { return s.id === oSlot.id; });
            if (iIndex >= 0) {
                aSlots[iIndex] = oSlot;
                oModel.setProperty("/availabilitySlots", aSlots);
            }
            
            this._loadFreeSlots();
            this._loadMyBookedSlots(sStudentId);
            
            MessageToast.show(this.getResourceBundle().getText("appointmentBooked"));
        },

        onCancelBooking: function(oEvent) {
            var oModel = this._appointmentsModel;
            var oItem = oEvent.getSource().getParent().getParent();
            var sPath = oItem.getBindingContext("appointments").getPath();
            var oSlot = oModel.getProperty(sPath);
            
            MessageBox.confirm(this.getResourceBundle().getText("confirmCancelBooking"), {
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                onClose: function(oAction) {
                    if (oAction === MessageBox.Action.YES) {
                        // Free up the slot
                        oSlot.status = "free";
                        oSlot.bookedBy = null;
                        oSlot.studentName = null;
                        
                        var aSlots = oModel.getProperty("/availabilitySlots");
                        var iIndex = aSlots.findIndex(function(s) { return s.id === oSlot.id; });
                        if (iIndex >= 0) {
                            aSlots[iIndex] = oSlot;
                            oModel.setProperty("/availabilitySlots", aSlots);
                        }
                        
                        var sStudentId = oModel.getProperty("/currentStudentId");
                        this._loadFreeSlots();
                        this._loadMyBookedSlots(sStudentId);
                        
                        MessageToast.show(this.getResourceBundle().getText("bookingCancelled"));
                    }
                }.bind(this)
            });
        },

        getResourceBundle: function() {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        }
    });
});
