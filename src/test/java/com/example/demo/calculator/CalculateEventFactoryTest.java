package com.example.demo.calculator;

import com.example.demo.calculator.domain.Operations;
import com.example.demo.calculator.event.AddEvent;
import com.example.demo.calculator.event.ClearEvent;
import com.example.demo.calculator.event.DivideEvent;
import com.example.demo.calculator.event.MinusEvent;
import com.example.demo.calculator.event.MultiplyEvent;
import com.example.demo.calculator.event.Operator;
import com.example.demo.calculator.event.SqrtEvent;
import com.example.demo.calculator.event.UndoEvent;
import com.example.demo.event.Event;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.Parameterized;

import java.util.Arrays;
import java.util.Collection;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

@RunWith(Parameterized.class)
public class CalculateEventFactoryTest {
    private CalculateEventFactory factory;

    @Before
    public void setUp() throws Exception {
        factory = new CalculateEventFactory();
    }

    @After
    public void tearDown() throws Exception {
        factory = null;
    }

    @Parameterized.Parameters
    public static Collection<Object[]> data() {
        return Arrays.asList(new Object[][]{
                {Operations.ADDITION, new AddEvent()},
                {Operations.SUBTRACTION, new MinusEvent()},
                {Operations.MULTIPLICATION, new MultiplyEvent()},
                {Operations.DIVISION, new DivideEvent()},
                {Operations.SQRT, new SqrtEvent()},
                {Operations.UNDO, new UndoEvent()},
                {Operations.CLEAR, new ClearEvent()},
        });
    }

    private String input;

    private Event expected;

    public CalculateEventFactoryTest(String in, Event ex) {
        this.input = in;
        this.expected = ex;
    }

    @Test
    public void test_create() {
        assertEquals(expected.getType(), factory.create(input).getType());
        assertEquals(((Operator)expected).getOperator(), ((Operator)factory.create(input)).getOperator());
    }


}