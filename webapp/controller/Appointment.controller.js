sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function(Controller, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("project1.controller.Appointment", {
        onInit: function() {
            this._appointmentsModel = this.getOwnerComponent().getModel("appointments");
            this._loadAdvisorSlots();
        },

        _loadAdvisorSlots: function() {
            var oModel = this._appointmentsModel;
            var sAdvisorId = oModel.getProperty("/loggedInAdvisorId");
            var aAllSlots = oModel.getProperty("/availabilitySlots") || [];
            
            // Filter slots for this advisor
            var aMySlots = aAllSlots.filter(function(slot) {
                return slot.advisorId === sAdvisorId;
            });
            
            oModel.setProperty("/mySlots", aMySlots);
        },

        onAddSlot: function() {
            var oModel = this._appointmentsModel;
            var oSlot = oModel.getProperty("/slotDraft");
            
            if (!oSlot.date || !oSlot.time) {
                MessageBox.error(this.getResourceBundle().getText("validationError"));
                return;
            }

            if (oSlot.duration > 60) {
                MessageBox.error("Duration cannot exceed 60 minutes.");
                return;
            }

            var sAdvisorId = oModel.getProperty("/loggedInAdvisorId");
            var aAllSlots = oModel.getProperty("/availabilitySlots") || [];
            
            // In edit mode, check for duplicates excluding the current slot being edited
            // In create mode, check for any duplicates
            var bDuplicateExists = aAllSlots.some(function(slot) {
                var isDuplicate = slot.advisorId === sAdvisorId && 
                       slot.date === oSlot.date && 
                       slot.time === oSlot.time;
                if (oSlot.isEditMode) {
                    return isDuplicate && slot.id !== oSlot.editSlotId;
                }
                return isDuplicate;
            });
            
            if (bDuplicateExists) {
                MessageBox.error(this.getResourceBundle().getText("duplicateSlotError"));
                return;
            }

            var aAdvisors = oModel.getProperty("/advisors") || [];
            var oAdvisor = aAdvisors.find(function(a) { return a.id === sAdvisorId; });

            var aSlots = oModel.getProperty("/availabilitySlots") || [];

            if (oSlot.isEditMode) {
                // Update existing slot
                var iIndex = aSlots.findIndex(function(s) { return s.id === oSlot.editSlotId; });
                if (iIndex >= 0) {
                    aSlots[iIndex].date = oSlot.date;
                    aSlots[iIndex].time = oSlot.time;
                    aSlots[iIndex].duration = oSlot.duration || 60;
                    oModel.setProperty("/availabilitySlots", aSlots);
                    MessageToast.show("Slot updated successfully");
                }
            } else {
                // Create new slot
                var oNewSlot = {
                    id: "SLT-" + Math.floor(1000 + Math.random() * 9000),
                    advisorId: sAdvisorId,
                    advisorName: oAdvisor ? oAdvisor.name : sAdvisorId,
                    date: oSlot.date,
                    time: oSlot.time,
                    duration: oSlot.duration || 60,
                    status: "free",
                    bookedBy: null,
                    studentName: null
                };
                aSlots.push(oNewSlot);
                oModel.setProperty("/availabilitySlots", aSlots);
                MessageToast.show(this.getResourceBundle().getText("slotCreated"));
            }

            this._loadAdvisorSlots();

            // Reset draft
            oModel.setProperty("/slotDraft", {
                date: null,
                time: "",
                duration: 60,
                isEditMode: false,
                editSlotId: null
            });
        },

        onEditSlot: function(oEvent) {
            var oModel = this._appointmentsModel;
            var oItem = oEvent.getSource().getParent().getParent();
            var sPath = oItem.getBindingContext("appointments").getPath();
            var oSlot = oModel.getProperty(sPath);

            // Load slot into draft for editing
            oModel.setProperty("/slotDraft", {
                date: oSlot.date,
                time: oSlot.time,
                duration: oSlot.duration,
                isEditMode: true,
                editSlotId: oSlot.id
            });
        },

        onCancelEdit: function() {
            var oModel = this._appointmentsModel;
            oModel.setProperty("/slotDraft", {
                date: null,
                time: "",
                duration: 60,
                isEditMode: false,
                editSlotId: null
            });
        },

        onDeleteSlot: function(oEvent) {
            var oModel = this._appointmentsModel;
            var oItem = oEvent.getSource().getParent().getParent();
            var sPath = oItem.getBindingContext("appointments").getPath();
            var oSlot = oModel.getProperty(sPath);

            if (oSlot.status === "booked") {
                MessageBox.error(this.getResourceBundle().getText("cannotDeleteBooked"));
                return;
            }

            MessageBox.confirm(this.getResourceBundle().getText("confirmDeleteSlot"), {
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                onClose: function(oAction) {
                    if (oAction === MessageBox.Action.YES) {
                        var aSlots = oModel.getProperty("/availabilitySlots");
                        var iIndex = aSlots.findIndex(function(s) { return s.id === oSlot.id; });
                        if (iIndex >= 0) {
                            aSlots.splice(iIndex, 1);
                            oModel.setProperty("/availabilitySlots", aSlots);
                            this._loadAdvisorSlots();
                            MessageToast.show(this.getResourceBundle().getText("slotDeleted"));
                        }
                    }
                }.bind(this)
            });
        },

        getResourceBundle: function() {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        }
    });
});
