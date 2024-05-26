import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.scss";
import Web3Provider from "./components/Web3Provider.tsx";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import NetworkProvider from "./components/NetworkProvider.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <NetworkProvider>
    <Web3Provider>
      <App />
    </Web3Provider>
  </NetworkProvider>
);
