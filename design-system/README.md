# Well design system — not a skill

`well-tokens.css` is a copy of what [`@wellapp-ai/design-tokens`][pkg] builds, refreshed by
`.github/workflows/refresh-design-system.yml`.

It lives here rather than under `skills/` on purpose. A design system is Well's brand, not
a capability a user installs: shipping it as a skill put it in the catalogue as a peer of
`runway`, where it answers no question anyone would ask. It also advertised a
dependency on twenty skills when only three of them could act on it.

So the values are generated into the skills that actually compose a visual — today
`fx-exposure` and `rank-clients-by-ltv`, the two whose tool ships no widget of its own — by
`scripts/generate-style-blocks.mjs`, between markers under each one's
`## Styling a composed view`.

## Changing it

Never edit a generated block by hand, and never edit `well-tokens.css` to change a colour —
it is a copy. Move the token in `@wellapp-ai/design-tokens`, publish, then:

```sh
make refresh        # pull the package, rewrite the blocks, rebuild dist/
make refresh-check  # fail if either the copy or a block is behind
```

To give a fourth skill a styling section, add its name to `COMPOSING_SKILLS` in the
generator and put the two markers under a `## Styling a composed view` heading in its
`SKILL.md`. The generator fails loudly if the markers are missing, so a half-done addition
does not pass quietly.

The precompiled `well.css` is deliberately not carried here. It was 116 KB of Tailwind
utilities for a job that needs about thirty values, and nothing consumed the utilities.

[pkg]: https://github.com/WellApp-ai/platform/tree/develop/packages/design-tokens
