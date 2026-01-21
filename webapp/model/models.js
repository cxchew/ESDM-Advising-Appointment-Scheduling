sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device"
], 
function (JSONModel, Device) {
    "use strict";

    return {
        /**
         * Provides runtime information for the device the UI5 app is running on as a JSONModel.
         * @returns {sap.ui.model.json.JSONModel} The device model.
         */
        createDeviceModel: function () {
            var oModel = new JSONModel(Device);
            oModel.setDefaultBindingMode("OneWay");
            return oModel;
        },
        /**
         * Provides a JSONModel holding advising appointments, advisors, time slots and a draft entry.
         * Loads initial mock data from project1/model/appointments.json.
         * @returns {sap.ui.model.json.JSONModel} The appointments model.
         */
        createAppointmentsModel: function () {
            var oModel = new JSONModel({
                advisors: [
                    { id: "ADV001", name: "Dr. Tan" },
                    { id: "ADV002", name: "Prof. Lee" },
                    { id: "ADV003", name: "Ms. Kumar" }
                ],
                students: [
                    { id: "S1234567", name: "Alice Ng", advisorId: "ADV001" },
                    { id: "S2345678", name: "Ben Chia", advisorId: "ADV002" },
                    { id: "S3456789", name: "Chloe Tan", advisorId: "ADV003" }
                ],
                // Weekly availability per advisor: 0=Sun ... 6=Sat
                availability: {
                    "ADV001": { "1": ["09:00","09:30","10:00"], "2": ["10:00","10:30","11:00"], "4": ["14:00","14:30","15:00"] },
                    "ADV002": { "1": ["11:00","11:30"], "3": ["09:00","09:30","10:00","10:30"], "5": ["14:00","14:30"] },
                    "ADV003": { "2": ["09:00","09:30"], "4": ["10:00","10:30","11:00"], "5": ["15:00","15:30"] }
                },
                timeSlots: [
                    "09:00", "09:30", "10:00", "10:30",
                    "11:00", "11:30", "14:00", "14:30",
                    "15:00", "15:30"
                ],
                filteredSlots: [],
                appointments: [],
                draft: {
                    studentName: "",
                    studentId: "",
                    advisorId: "",
                    date: null,
                    time: "",
                    notes: ""
                }
            });
            // Try loading mock appointments from JSON; ignore errors if file not found
            try {
                var sUrl = sap.ui.require.toUrl("project1/model/appointments.json");
                oModel.loadData(sUrl);
            } catch (e) {
                // no-op: keep default empty appointments
            }
            return oModel;
        }
    };

});