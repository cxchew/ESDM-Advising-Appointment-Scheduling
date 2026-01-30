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

            var sAdvisorId = oModel.getProperty("/loggedInAdvisorId");
            var aAdvisors = oModel.getProperty("/advisors") || [];
            var oAdvisor = aAdvisors.find(function(a) { return a.id === sAdvisorId; });

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

            var aSlots = oModel.getProperty("/availabilitySlots") || [];
            aSlots.push(oNewSlot);
            oModel.setProperty("/availabilitySlots", aSlots);
            this._loadAdvisorSlots();

            // Reset draft
            oModel.setProperty("/slotDraft", {
                date: null,
                time: "",
                duration: 60
            });

            MessageToast.show(this.getResourceBundle().getText("slotCreated"));
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
