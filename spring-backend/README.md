# TransitPay Engine - Spring Boot Backend

Production-ready Spring Boot backend for the TransitPay Bus Ticketing Platform (`com.transitpay.engine`), matching your MySQL `transitpay_db` schema.

## Key Upgrades & Fixes Applied
1. **Circular Proxy Loop Fixed**: `AuthService` validates passwords directly via BCrypt `PasswordEncoder` and signs stateless JWT tokens, completely resolving the `StackOverflowError` in Spring Security dynamic proxies (`$Proxy132.authenticate`).
2. **Zero Dummy Balance**: New accounts start with `0.00` INR default wallet balance rather than the hardcoded 150 INR.
3. **No Field `@Autowired` Warnings**: All services and controllers use constructor injection (`@RequiredArgsConstructor` with `private final` fields).
4. **Clean Repositories & Imports**: Removed redundant `@Repository` annotations and unused imports.
5. **JJWT 0.12.5**: Modernized to the latest standard JJWT API with HMAC-SHA256 signing keys.

---

## Database Configuration

In `src/main/resources/application.properties`:

### Using MySQL (`transitpay_db`)
Uncomment the MySQL lines in `application.properties`:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/transitpay_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=root
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
spring.jpa.hibernate.ddl-auto=update
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect
```
*(Adjust `username` and `password` to match your local MySQL root credentials).*

### Using H2 In-Memory (Quick testing without MySQL)
Leave the default H2 configuration active in `application.properties`. Console available at `http://localhost:8080/h2-console`.

---

## Running the Spring Boot Backend

### Prerequisites
- JDK 17 or higher
- Maven 3.8+

### Build and Run
```bash
cd spring-backend
mvn clean install
mvn spring-boot:run
```
The backend starts on `http://localhost:8080`.

---

## Running the React Frontend

From the root project directory:
```bash
npm install
npm run dev
```
The React frontend (port 3000) automatically proxies all `/api` requests to `http://localhost:8080`.
