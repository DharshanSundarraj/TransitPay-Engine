package com.transitpay.engine.service;

import com.transitpay.engine.dto.PassengerProfileResponse;
import com.transitpay.engine.dto.TicketRequest;
import com.transitpay.engine.model.FareReceipt;
import com.transitpay.engine.model.Ticket;
import com.transitpay.engine.model.User;
import com.transitpay.engine.repository.FareReceiptRepository;
import com.transitpay.engine.repository.TicketRepository;
import com.transitpay.engine.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TransitServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private TicketRepository ticketRepository;

    @Mock
    private FareReceiptRepository fareReceiptRepository;

    @InjectMocks
    private TransitService transitService;

    @Test
    void getPassengerProfile_shouldReturnProfileWithTicketsAndTransactions() {
        User user = User.builder()
                .id(3L)
                .username("alice")
                .walletBalance(22.5)
                .build();
        Ticket ticket = Ticket.builder()
                .id(9L)
                .cardId("CARD-00003")
                .busNumber("12")
                .boardingStage("A")
                .alightingStage("B")
                .route("A -> B")
                .amount(10.0)
                .timestamp(1710000000L)
                .build();
        FareReceipt receipt = FareReceipt.builder()
                .id(5L)
                .cardId("CARD-00003")
                .type("DEPOSIT")
                .amount(20.0)
                .timestamp(1710000100L)
                .build();

        when(userRepository.findByUsername("alice")).thenReturn(Optional.of(user));
        when(ticketRepository.findByCardIdOrderByTimestampDesc("CARD-00003")).thenReturn(List.of(ticket));
        when(fareReceiptRepository.findByCardIdOrderByTimestampDesc("CARD-00003")).thenReturn(List.of(receipt));

        PassengerProfileResponse response = transitService.getPassengerProfile("alice");

        assertAll(
                () -> assertEquals("alice", response.getName()),
                () -> assertEquals("CARD-00003", response.getCardId()),
                () -> assertEquals(22.5, response.getWalletBalance()),
                () -> assertEquals(1, response.getTickets().size()),
                () -> assertEquals(1, response.getTransactions().size())
        );
    }

    @Test
    void deposit_shouldIncreaseBalanceAndPersistReceipt() {
        User user = User.builder()
                .id(3L)
                .username("alice")
                .walletBalance(10.0)
                .build();

        when(userRepository.findByUsername("alice")).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);

        Double newBalance = transitService.deposit("alice", 5.0);

        assertAll(
                () -> assertEquals(15.0, newBalance),
                () -> assertEquals(15.0, user.getWalletBalance()),
                () -> verify(fareReceiptRepository).save(any(FareReceipt.class))
        );
    }

    @Test
    void issueTicket_shouldRejectWhenBalanceIsInsufficient() {
        User user = User.builder()
                .id(3L)
                .username("alice")
                .walletBalance(4.0)
                .build();
        TicketRequest request = new TicketRequest("CARD-00003", "12", "A", "B", "A -> B", 10.0, 1);

        when(userRepository.findById(3L)).thenReturn(Optional.of(user));

        assertThrows(IllegalStateException.class, () -> transitService.issueTicket(request));
    }

    @Test
    void issueTicket_shouldDeductBalanceAndStoreTicket() {
        User user = User.builder()
                .id(3L)
                .username("alice")
                .walletBalance(50.0)
                .build();
        TicketRequest request = new TicketRequest("CARD-00003", "12", "A", "B", "A -> B", 10.0, 1);
        Ticket savedTicket = Ticket.builder()
                .id(99L)
                .cardId("CARD-00003")
                .busNumber("12")
                .boardingStage("A")
                .alightingStage("B")
                .route("A -> B")
                .amount(10.0)
                .timestamp(1710000200L)
                .build();

        when(userRepository.findById(3L)).thenReturn(Optional.of(user));
        when(ticketRepository.save(any(Ticket.class))).thenReturn(savedTicket);
        when(fareReceiptRepository.save(any(FareReceipt.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Ticket result = transitService.issueTicket(request);

        assertAll(
                () -> assertEquals(40.0, user.getWalletBalance()),
                () -> assertEquals("CARD-00003", result.getCardId()),
                () -> assertEquals(10.0, result.getAmount()),
                () -> verify(fareReceiptRepository).save(any(FareReceipt.class))
        );
    }
}
