package dev.portfolio.commerce;

import jakarta.validation.ConstraintViolationException;
import org.springframework.dao.PessimisticLockingFailureException;
import org.springframework.http.*;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class Errors {
  @ExceptionHandler(ResponseStatusException.class)
  ResponseEntity<ProblemDetail> business(ResponseStatusException e) {
    return ResponseEntity.status(e.getStatusCode())
        .body(ProblemDetail.forStatusAndDetail(e.getStatusCode(), e.getReason()));
  }

  @ExceptionHandler({
    MethodArgumentNotValidException.class,
    ConstraintViolationException.class,
    HttpMessageNotReadableException.class,
    org.springframework.web.method.annotation.HandlerMethodValidationException.class
  })
  ResponseEntity<ProblemDetail> invalid(Exception e) {
    return ResponseEntity.badRequest()
        .body(
            ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST,
                "Solicitud inválida. Revisa productos y cantidades (1–99)."));
  }

  @ExceptionHandler(PessimisticLockingFailureException.class)
  ResponseEntity<ProblemDetail> busy(Exception e) {
    return ResponseEntity.status(409)
        .body(
            ProblemDetail.forStatusAndDetail(
                HttpStatus.CONFLICT, "Inventario ocupado. Intenta de nuevo."));
  }
}
