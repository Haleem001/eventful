import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { TicketsService } from './tickets.service';
import { Ticket } from './entities/ticket.entity';
import { TicketStatus } from './enums/ticket-status.enum';
import * as QRCode from 'qrcode';

jest.mock('qrcode');

describe('TicketsService', () => {
  let service: TicketsService;
  let ticketRepository: Repository<Ticket>;
  let configService: ConfigService;

  const mockTicket: Ticket = {
    id: 'ticket-uuid',
    reference: 'evt_abc12345',
    status: TicketStatus.PAID,
    isScanned: false,
    qrCode: null,
    qrToken: null,
    eventeeId: 'eventee-uuid',
    eventee: null as any,
    eventId: 'event-uuid',
    event: { id: 'event-uuid', creatorId: 'creator-uuid', title: 'Test Event', description: '', venue: '', date: new Date(), price: 0, capacity: 0, ticketsSold: 0, category: '', creator: null as any, tickets: [], createdAt: new Date() } as any,
    createdAt: new Date('2026-01-01'),
  };

  const mockExecute = jest.fn().mockResolvedValue({ affected: 1 });
  const mockAndWhere = jest.fn().mockReturnThis();
  const mockWhere = jest.fn().mockReturnThis();
  const mockSet = jest.fn().mockReturnThis();
  const mockUpdate = jest.fn().mockReturnThis();
  const mockCreateQueryBuilder = jest.fn(() => ({
    update: mockUpdate,
    set: mockSet,
    where: mockWhere,
    andWhere: mockAndWhere,
    execute: mockExecute,
  }));

  const mockTicketRepository = {
    manager: { createQueryBuilder: mockCreateQueryBuilder },
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockConfigService = {
    getOrThrow: jest.fn().mockReturnValue('test-secret'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    (QRCode.toDataURL as jest.Mock).mockResolvedValue(
      'data:image/png;base64,mock_qr_code',
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        {
          provide: getRepositoryToken(Ticket),
          useValue: mockTicketRepository,
        },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
    ticketRepository = module.get(getRepositoryToken(Ticket));
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('create', () => {
    it('should create a ticket with QR code and token', async () => {
      (QRCode.toDataURL as jest.Mock).mockResolvedValue(
        'data:image/png;base64,mock_qr_code',
      );
      const createInput = {
        reference: 'evt_abc12345',
        eventeeId: 'eventee-uuid',
        eventId: 'event-uuid',
        status: TicketStatus.PAID,
        qrToken: expect.any(String),
      };
      mockTicketRepository.create.mockReturnValue({
        ...mockTicket,
        qrToken: 'hmac-token',
      });
      mockTicketRepository.save.mockResolvedValue({
        ...mockTicket,
        qrToken: 'hmac-token',
        qrCode: 'data:image/png;base64,mock_qr_code',
      });

      const result = await service.create(
        'evt_abc12345',
        'eventee-uuid',
        'event-uuid',
      );

      expect(mockTicketRepository.create).toHaveBeenCalledWith(createInput);
      expect(result.qrCode).toBe('data:image/png;base64,mock_qr_code');
      expect(result.qrToken).toBeTruthy();
    });
  });

  describe('verify', () => {
    it('should mark a paid ticket as scanned', async () => {
      const paidTicket = { ...mockTicket, status: TicketStatus.PAID };
      mockTicketRepository.findOne.mockResolvedValue(paidTicket);
      mockTicketRepository.save.mockResolvedValue({
        ...paidTicket,
        isScanned: true,
      });

      const result = await service.verify('ticket-uuid');

      expect(result.isScanned).toBe(true);
      expect(mockTicketRepository.save).toHaveBeenCalledWith({
        ...paidTicket,
        isScanned: true,
      });
    });

    it('should throw BadRequestException if ticket is not PAID', async () => {
      const pendingTicket = { ...mockTicket, status: TicketStatus.PENDING };
      mockTicketRepository.findOne.mockResolvedValue(pendingTicket);

      await expect(service.verify('ticket-uuid')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ForbiddenException if ticket belongs to another creator', async () => {
      mockTicketRepository.findOne.mockResolvedValue(mockTicket);

      await expect(service.verify('ticket-uuid', 'other-creator')).rejects.toThrow(
        'You can only verify tickets for your own events.',
      );
    });

    it('should throw BadRequestException if ticket is already scanned', async () => {
      const scannedTicket = {
        ...mockTicket,
        status: TicketStatus.PAID,
        isScanned: true,
      };
      mockTicketRepository.findOne.mockResolvedValue(scannedTicket);

      await expect(service.verify('ticket-uuid')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findByReference', () => {
    it('should return a ticket by reference', async () => {
      mockTicketRepository.findOne.mockResolvedValue(mockTicket);

      const result = await service.findByReference('evt_abc12345');

      expect(result).toEqual(mockTicket);
    });

    it('should return null for unknown reference', async () => {
      mockTicketRepository.findOne.mockResolvedValue(null);

      const result = await service.findByReference('unknown');

      expect(result).toBeNull();
    });
  });

  describe('findOne', () => {
    it('should return a ticket by id', async () => {
      mockTicketRepository.findOne.mockResolvedValue(mockTicket);

      const result = await service.findOne('ticket-uuid');

      expect(result.id).toBe('ticket-uuid');
    });

    it('should throw NotFoundException if ticket not found', async () => {
      mockTicketRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
