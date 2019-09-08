package com.example.demo.calculator;

import com.example.demo.calculator.exception.IllegalOperatorException;
import com.example.demo.calculator.exception.InsufficientParameterException;
import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Ignore;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.junit.MockitoJUnitRunner;

import java.math.BigDecimal;
import java.util.List;


@RunWith(MockitoJUnitRunner.class)
public class CalculatorTest {
    private Calculator calculator;

    @Before
    public void setUp() throws Exception {
        calculator = new Calculator();
    }

    @After
    public void tearDown() throws Exception {
        calculator = null;
    }

    @Test
    public void getValues_should_display_10_digit() {
        BigDecimal bigDecimal = new BigDecimal(1. / 3);
        calculator.doNumeric(bigDecimal);
        List<String> values = calculator.getValues();
        Assert.assertEquals("0.3333333333", values.get(0));
    }

    @Test
    public void getValues_should_display_1_digit() {
        BigDecimal bigDecimal = new BigDecimal(1l);
        calculator.doNumeric(bigDecimal);
        List<String> values = calculator.getValues();
        Assert.assertEquals("1", values.get(0));
    }

    @Test
    public void doBiOperation_should_apply_function() {
        calculator.doNumeric(new BigDecimal(1l));
        calculator.doNumeric(new BigDecimal(3l));
        calculator.doBiOperation("+", (l,r)-> l.add(r),null);
        Assert.assertEquals("4", calculator.getValues().get(0));
    }

    @Test(expected= InsufficientParameterException.class)
    public void doBiOperation_should_throw_exception() {
        calculator.doNumeric(new BigDecimal(3l));
        calculator.doBiOperation("+", (l,r)-> l.add(r),null);
    }

    @Test(expected= IllegalOperatorException.class)
    public void doBiOperation_should_throw_validation_exception() {
        calculator.doNumeric(new BigDecimal(3l));
        calculator.doNumeric(new BigDecimal(0l));
        calculator.doBiOperation("/", (l,r)-> l.add(r),(l,r)-> r.signum()==0);
    }

    @Test
    @Ignore
    public void doOperation() {
        //todo add more unit test
    }

    @Test
    @Ignore
    public void doClear() {
    }

    @Test
    @Ignore
    public void doNumeric() {
    }

    @Test
    @Ignore
    public void undo() {
    }
}