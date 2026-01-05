import '@testing-library/jest-dom'

// 1. Mock LocalStorage (Used for your Favorites/Watchlist feature)
const localStorageMock = {
  getItem: jest.fn(),
    setItem: jest.fn(),
      removeItem: jest.fn(),
        clear: jest.fn(),
        };
        global.localStorage = localStorageMock;

        // 2. Mock matchMedia (Used by some UI components for responsive design)
        Object.defineProperty(window, 'matchMedia', {
          writable: true,
            value: jest.fn().mockImplementation(query => ({
                matches: false,
                    media: query,
                        onchange: null,
                            addListener: jest.fn(), // deprecated
                                removeListener: jest.fn(), // deprecated
                                    addEventListener: jest.fn(),
                                        removeEventListener: jest.fn(),
                                            dispatchEvent: jest.fn(),
                                              })),
                                              });

                                              // 3. Mock Next.js Router (So we can test Deep Linking without crashing)
                                              jest.mock('next/router', () => ({
                                                useRouter() {
                                                    return {
                                                          route: '/',
                                                                pathname: '',
                                                                      query: {},
                                                                            asPath: '',
                                                                                  push: jest.fn(),
                                                                                        replace: jest.fn(),
                                                                                              events: {
                                                                                                      on: jest.fn(),
                                                                                                              off: jest.fn(),
                                                                                                                      emit: jest.fn(),
                                                                                                                            },
                                                                                                                                };
                                                                                                                                  },
                                                                                                                                  }));