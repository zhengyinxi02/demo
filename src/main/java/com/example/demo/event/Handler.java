package com.example.demo.event;

public interface Handler<E extends Event> {

    Class<E> getEventClass();

    void onEvent(E event);

}
