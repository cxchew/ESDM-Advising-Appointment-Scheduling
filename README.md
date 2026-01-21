## Application Details
|               |
| ------------- |
|**Generation Date and Time**<br>Tue Jan 20 2026 08:48:49 GMT+0000 (Coordinated Universal Time)|
|**App Generator**<br>SAP Fiori Application Generator|
|**App Generator Version**<br>1.20.1|
|**Generation Platform**<br>SAP Business Application Studio|
|**Template Used**<br>Basic|
|**Service Type**<br>None|
|**Service URL**<br>N/A|
|**Module Name**<br>project1|
|**Application Title**<br>App Title|
|**Namespace**<br>|
|**UI5 Theme**<br>sap_horizon|
|**UI5 Version**<br>1.143.2|
|**Enable TypeScript**<br>False|
|**Add Eslint configuration**<br>False|

## project1

An SAP Fiori application.

### Starting the generated app

-   This app has been generated using the SAP Fiori tools - App Generator, as part of the SAP Fiori tools suite.  To launch the generated application, run the following from the generated application root folder:

```
    npm start
```

#### Pre-requisites:

1. Active NodeJS LTS (Long Term Support) version and associated supported NPM version.  (See https://nodejs.org)

### Advising Appointment Scheduling (Sub-module)

- Navigate to the home view and click "Open Advising Scheduling" to access the appointments module.
- Create an appointment by filling Student Name, Student ID, Advisor, Date, Time, and optional Notes, then press "Create Appointment".
- Existing appointments appear in the list; use "Cancel" to remove an appointment.
- This sub-module uses a local JSON model with mock data at webapp/model/appointments.json and does not connect to external services.


