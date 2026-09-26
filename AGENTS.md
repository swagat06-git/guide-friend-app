<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep the FastAPI contract in `src/services/api.ts` and use the single `AtlasProvider` polling source on the dashboard; each tracking GET advances a simulator frame, so independent component polling would alter behavior.
- Use TanStack Start file routes for Home and Dashboard and keep dashboard telemetry strictly tied to backend responses; the landing preview is explicitly illustrative.
- Keep decorative pointer motion on Home as CSS-variable updates to section DOM elements rather than React state, so cursor movement does not rerender telemetry or page content.
