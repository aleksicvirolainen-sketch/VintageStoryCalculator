import "../styles/themes.css";
import "../styles/base.css";
import "../styles/layout.css";
import "../styles/components.css";
import "../styles/calculator.css";

import { mount } from "svelte";
import App from "./App.svelte";

const app = mount(App, {
  target: document.getElementById("app") ?? document.body
});

export default app;
