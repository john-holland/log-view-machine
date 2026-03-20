# container-cave-adapter

Tome container adapter for [log-view-machine](https://github.com/viewstatemachine/log-view-machine) with header/footer tracking and composed-view override.

## Features

- **Header and footer tracking**: One header at top, one footer at bottom per Cave/Tome
- **Container override**: Replace default `div.composed-view` with custom tag and classes
- **Override limit**: Optionally restrict overrides to first N containers (default: infinite)

## Installation

```bash
npm install container-cave-adapter react log-view-machine
```

## Usage

```tsx
import {
  ContainerAdapterProvider,
  useContainerAdapter,
  useContainerAdapterFragmentsFromApi,
} from 'container-cave-adapter';

// Wrap your Tome render tree with the provider
<ContainerAdapterProvider
  tomeId="my-tome"
  containerOverrideTag="section"
  containerOverrideClasses="container-mod-foo composed-view"
  headerFragment={headerHtml}
  footerFragment={footerHtml}
>
  {machine.render(model)}
</ContainerAdapterProvider>
```

### Fetch header/footer from API

```tsx
const { headerFragment, footerFragment, isLoading } = useContainerAdapterFragmentsFromApi(
  'https://api.example.com'
);

if (!isLoading && headerFragment && footerFragment) {
  return (
    <ContainerAdapterProvider
      headerFragment={headerFragment}
      footerFragment={footerFragment}
    >
      {children}
    </ContainerAdapterProvider>
  );
}
```

## Peer dependencies

- `react` ^18.0.0
