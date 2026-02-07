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
                    { 
                        id: "ADV001", 
                        name: "Dr. Tan", 
                        email: "dr.tan@university.edu",
                        department: "School of Engineering",
                        phone: "+65 6790-6789",
                        officeHours: "Mon-Fri 2:00 PM - 5:00 PM",
                        specialization: "Software Engineering",
                        password: "advisor123"
                    },
                    { 
                        id: "ADV002", 
                        name: "Prof. Lee", 
                        email: "prof.lee@university.edu",
                        department: "School of Science",
                        phone: "+65 6790-6701",
                        officeHours: "Tue-Thu 10:00 AM - 12:00 PM",
                        specialization: "Data Science",
                        password: "advisor123"
                    },
                    { 
                        id: "ADV003", 
                        name: "Ms. Kumar", 
                        email: "ms.kumar@university.edu",
                        department: "School of Business",
                        phone: "+65 6790-6703",
                        officeHours: "Mon, Wed, Fri 3:00 PM - 5:00 PM",
                        specialization: "Business Analytics",
                        password: "advisor123"
                    }
                ],
                students: [
                    { 
                        id: "S1234567", 
                        name: "Alice Ng", 
                        email: "alice.ng@student.edu",
                        matric: "U1234567",
                        program: "Bachelor of Engineering (Software)",
                        year: "Year 2",
                        advisorId: "ADV001",
                        advisorName: "Dr. Tan",
                        password: "student123"
                    },
                    { 
                        id: "S2345678", 
                        name: "Ben Chia", 
                        email: "ben.chia@student.edu",
                        matric: "U2345678",
                        program: "Bachelor of Science (Data Science)",
                        year: "Year 3",
                        advisorId: "ADV002",
                        advisorName: "Prof. Lee",
                        password: "student123"
                    },
                    { 
                        id: "S3456789", 
                        name: "Chloe Tan", 
                        email: "chloe.tan@student.edu",
                        matric: "U3456789",
                        program: "Bachelor of Business (Analytics)",
                        year: "Year 1",
                        advisorId: "ADV003",
                        advisorName: "Ms. Kumar",
                        password: "student123"
                    }
                ],
                // Weekly availability per advisor: 0=Sun ... 6=Sat
                availability: {
                    "ADV001": { "1": ["08:00","09:00","10:00","11:00"], "2": ["10:00","11:00","14:00","15:00"], "4": ["14:00","15:00","16:00"] },
                    "ADV002": { "1": ["09:00","11:00","13:00"], "3": ["08:00","09:00","10:00","11:00"], "5": ["14:00","15:00","16:00"] },
                    "ADV003": { "2": ["08:00","09:00","10:00"], "4": ["10:00","11:00","13:00","14:00"], "5": ["15:00","16:00","17:00"] }
                },
                timeSlots: [
                    "08:00", "09:00", "10:00", "11:00", "12:00",
                    "13:00", "14:00", "15:00", "16:00", "17:00"
                ],
                filteredSlots: [
                    "08:00", "09:00", "10:00", "11:00", "12:00",
                    "13:00", "14:00", "15:00", "16:00", "17:00"
                ],
                availabilitySlots: [],
                loggedInAdvisorId: "ADV001",
                loggedInAdvisorName: "Dr. Tan",
                loggedInStudentId: "S1234567",
                loggedInStudentName: "Alice Ng",
                mySlots: [],
                freeSlots: [],
                myBookedSlots: [],
                slotDraft: {
                    date: null,
                    time: "",
                    duration: 60,
                    isEditMode: false,
                    editSlotId: null
                },
                draft: {
                    id: null,
                    studentName: "",
                    studentId: "",
                    advisorId: "",
                    date: null,
                    time: "",
                    duration: 30,
                    notes: "",
                    isRescheduleMode: false
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