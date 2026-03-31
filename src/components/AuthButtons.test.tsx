// src/components/AuthButtons.test.tsx

import { render, screen } from '@testing-library/react';
import AuthButtons from './AuthButtons';

// Mock do next-auth/react
const mockUseSession = jest.fn();
jest.mock('next-auth/react', () => ({
  useSession: () => mockUseSession(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

// Mock do next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// Mock do next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
    return <a {...props}>{children}</a>;
  },
}));

describe('AuthButtons', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve mostrar botão "Login" quando não está autenticado', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    render(<AuthButtons />);

    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  it('deve mostrar avatar e botão "Sair" quando está autenticado', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'user1',
          name: 'Test User',
          image: 'https://example.com/avatar.jpg',
        },
      },
      status: 'authenticated',
    });

    render(<AuthButtons />);

    expect(screen.getByRole('button', { name: 'Sair' })).toBeInTheDocument();
    expect(screen.getByAltText('Test User')).toBeInTheDocument();
  });

  it('deve mostrar skeleton durante o loading', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
    });

    const { container } = render(<AuthButtons />);

    // O skeleton é um div com animate-pulse
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });
});
