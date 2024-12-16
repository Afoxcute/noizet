# No1zet Staking and vesting Dapp

This is a decentralized Staking & Vesting Dapp built on the Solana network. The application allows users to buy token, stake the tokens or vest it and users can do the same for NFT too, all while ensuring transparency and fairness through blockchain technology.

## Table of Contents

- [Getting Started](#getting-started)
- [Features](#features)
- [Architecture](#architecture)
- [Team Information](#team-information)
- [License](#license)

## Getting Started

To get started with the project, follow these steps:

1. Clone the repository


2. Install the dependencies


3. Buid and deploy the solana programs using anchor cli. Set up the necessary token addresses, program addresses and wallet addresses

4. Run the development server after installing the frontend dependencies


## Features

- **Staking**: Buy azl tokens in Raydium and stake in the dashboard to get rewards, You can also stake NFTs in the dapp
- **Vesting**: You can vest your tokens or NFTs too
- **Admin feature**: You need to input your connected wallet address in the source code to access the admin features
- **Admin Features**: Create stake pools, etc

## Architecture

The application is structured as follows:

- **Frontend**: Built with Next.js, utilizing React for the UI and tailwindcss for the styling.
- **Solana program**: The dapp logic is implemented in rust ensuring fairness in staking and vesting.
- **Blockchain**: All transactions are recorded on the Solana network.

### Key Components

- **Solana program**: /solana-NFT-staking - Contains the NFT staking program.
- **Solana program**: /solana-token-staking - Contain the token staking program.
- **Solana program**: /solana-token-vesting - Contain the vesting program.
- **Solana program**: /z01zet-tokenomics-contract - Contain the tokenomics program.


- **Frontend Pages**: 
  - `src/pages/Dashboard`: Dashboard.
  - `src/pages/createpool`: Pool creation.
  - `src/pages/layout`: Layout of the dapp.
  - `src/pages/send`: Send page.
  - `src/pages/setting`: Setting of the dapp.
  - `src/pages/staking`: staking of the dapp.
  - `src/pages/vesting`: vesting of the dapp.

- **Components**: 
  - contains all the app components



