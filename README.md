# CS465-Fullstack
CS-465 Full Stack Development with MEAN

# Travlr Getaways — CS 465 Full Stack Development

## Architecture

This project used two different approaches to frontend development. The customer-facing website uses HTML, CSS, and Handlebars templates rendered through Express. Express runs on the server, retrieves trip information, and passes that information to templates that generate the HTML sent to the browser. Shared header and footer partials help keep the pages consistent.

The administrative frontend uses Angular to create a single-page application (SPA). Angular uses HTML templates and TypeScript, which compiles to JavaScript, to manage interactions in the browser. Instead of loading a new page for every action, the SPA communicates with the Express API and updates the interface dynamically. The customer website focuses on browsing travel information, while the administrative SPA supports adding, editing, and deleting trips. Both interfaces use the same backend API and database.

MongoDB was a good fit because each trip can be stored as a document containing information such as its code, name, resort, price, and description. This structure works naturally with the objects used throughout the application and the JSON exchanged through the API. MongoDB also provides flexibility as the application’s data requirements change. Mongoose schemas, validation, and a unique trip-code index help maintain consistent data.

## Functionality

JavaScript is a programming language used to implement application behavior, while JSON is a text format used to store and exchange data. JSON resembles JavaScript object notation, but it has stricter formatting rules and cannot contain executable functions. In this application, JSON connects the frontend and backend by providing a common format for API requests and responses. The Angular application receives trip information as JSON and sends JSON when creating or updating trips. The Express customer website also retrieves trip data through the API before rendering its pages.

Throughout the project, refactoring helped reduce duplication and improve consistency. Shared Handlebars partials replaced repeated header and footer markup. In Angular, the reusable trip-card component provides a consistent layout for each trip, while the shared trip-form component supports both adding and editing trips. A trip-data service centralizes API requests so that individual components do not have to repeat that logic.

Another improvement involved handling trip prices consistently. Angular’s numeric form controls needed to work with the format expected by the data model. Updating the form’s conversion logic and allowing valid numeric inputs in the API resolved that mismatch. These changes made the application easier to maintain because shared functionality could be corrected in one place instead of across multiple screens.

## Testing

API testing requires understanding both endpoints and HTTP methods. An endpoint identifies the resource being accessed, while the method describes the action. For example, GET `/api/trips` retrieves trips, POST `/api/trips` creates a trip, and PUT or DELETE `/api/trips/:tripCode` updates or removes a specific trip. Testing these operations involves checking response data, status codes, validation, and whether changes are saved correctly in the database.

The project includes automated backend tests, Angular component and service tests, and Postman/Newman integration checks. These checks cover successful operations as well as invalid input, duplicate trip codes, missing records, and authentication failures. Testing failure cases is important because an application must respond predictably when a request cannot be completed.

Adding security introduced additional testing requirements. Customers still need public access to trip information, but requests that create, modify, or delete trips require a valid JSON Web Token. Security tests check incorrect passwords, missing tokens, invalid or expired tokens, and successful authenticated requests. Password-hashing tests also verify that sensitive information is excluded from user responses.

This project reinforced that frontend restrictions alone do not secure an application. Hiding an edit button or protecting an Angular route improves the interface, but the backend must independently verify authorization for every protected request. Automated tests provide evidence that these protections work, while a final manual browser walkthrough is still needed to confirm the complete user experience.

## Reflection

This course helped me work toward a career in software development by showing how frontend interfaces, server logic, databases, and authentication fit together in a complete application. I developed skills in building Express routes and controllers, creating reusable Angular components, modeling MongoDB data, and designing and testing REST APIs. Using Git branches for the different modules also helped me organize the project’s development and preserve its milestones.

One of the most valuable lessons was learning to troubleshoot across application layers. An issue that appears in a form may involve how the frontend represents a value, how the API validates it, or how the database stores it. Working through those connections strengthened my ability to investigate problems and develop consistent solutions.

The course also helped me recognize that a working feature needs more than a successful response. Validation, error handling, security, and testing are all necessary parts of a dependable application. This project gives me a portfolio example that demonstrates my ability to connect application layers, explain technical decisions, and build features that serve different types of users. These skills provide a stronger foundation for contributing to a development team and continuing to grow as a software developer.
