package com.example.demo.calculator.exception;

public class UnsupportedOperatorException extends RuntimeException {
    private String operator;
    public String getOperator(){
        return operator;
    }

    UnsupportedOperatorException(String e){
        operator = e;
    };
}
