import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";

function renderApp(initialRoute = "/") {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <App />
    </MemoryRouter>,
  );
}

test("renders Team Builder at the root route", () => {
  renderApp("/");

  expect(screen.getByRole("link", { name: "Team Builder" })).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { level: 1, name: /build your .+ squad/i }),
  ).toBeInTheDocument();
});

test("renders browse route", () => {
  renderApp("/browse");

  expect(screen.getByRole("link", { name: "Browse" })).toHaveClass("active");
  expect(screen.getByPlaceholderText(/search for a pokemon/i)).toBeInTheDocument();
});
