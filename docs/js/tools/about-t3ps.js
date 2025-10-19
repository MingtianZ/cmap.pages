// About T3PS tool module

export function getHTML() {
  return `
    <div class="about-container">
      <div class="about-content">
        <h1>About T3PS</h1>
        <h2>Tetrahydrofuran with 3' Phosphate and Capping Sugar</h2>

        <section class="about-section">
          <h3>Overview</h3>
          <p>
            T3PS is a computational model compound designed to investigate the intrinsic mechanical
            properties of the phosphodiester backbone in DNA. The model contains a phosphodiester
            linkage capped by furanose rings, allowing systematic exploration of conformational space
            relevant to the A, B<sub>I</sub>, and B<sub>II</sub> canonical forms of duplex DNA.
          </p>
          <p>
            By omitting nucleic acid bases and second phosphate moieties, T3PS isolates the intrinsic
            conformational preferences of the phosphodiester backbone, independent of base composition
            and intrastrand phosphate-phosphate repulsion effects.
          </p>
        </section>

        <section class="about-section">
          <h3>Scientific Background</h3>
          <p>
            Canonical forms of duplex DNA sample well-defined regions of the α, β, γ, ε, and ζ
            dihedral angles that define the phosphodiester linkage conformation. Understanding
            the intrinsic contribution of these five degrees of freedom to DNA conformational
            properties has remained challenging.
          </p>

          <div class="diagram-container">
            <img src="assets/t3ps_diagram.jpeg" alt="T3PS model compound structure" />
            <p class="caption">
              Figure 1. T3PS model compound showing the five backbone dihedral angles (α, β, γ, ε, ζ)
              sampled in conformational analysis
            </p>
          </div>
        </section>

        <section class="about-section">
          <h3>Methodology</h3>
          <p>
            <strong>Quantum Mechanical Calculations:</strong> Ab initio QM calculations at the
            MP2/6-31+G(d) level were performed to systematically sample potential energy surfaces
            of the five backbone dihedral angles.
          </p>
          <p>
            <strong>Constraint Protocol:</strong> Initial optimizations constrained non-target
            dihedrals and sugar puckers to values characteristic of A-form (C3'-endo) or B-form
            (C2'-endo) DNA, followed by full relaxation to determine minimum energy conformations.
          </p>
          <p>
            <strong>Energy Refinement:</strong> Single-point energy calculations using larger
            basis sets (aug-cc-pVTZ) with complete basis set (CBS) extrapolation provided
            accurate relative energies for different DNA conformational states.
          </p>
        </section>

        <section class="about-section">
          <h3>Key Findings</h3>
          <ul>
            <li><strong>B<sub>I</sub> Form Stability:</strong> The B<sub>I</sub> conformation is
            intrinsically favored over A and B<sub>II</sub> forms by at least 1.6 and 0.8 kcal/mol,
            respectively, consistent with experimental observations under high water activity</li>

            <li><strong>Energy Surface Correlation:</strong> Low energy regions of QM potential
            energy surfaces show strong correspondence with high-probability regions in
            crystallographic surveys, validating the T3PS model</li>

            <li><strong>Subtle Conformational Features:</strong> Features of the energy surfaces
            mirror subtle aspects of crystallographic probability distributions, suggesting
            significant contribution of backbone intrinsic properties to DNA structure</li>

            <li><strong>Single-Stranded DNA Prediction:</strong> The correlation between QM
            surfaces and duplex DNA sampling suggests single-stranded DNA preferentially adopts
            folded, duplex-like conformations, potentially lowering the entropic barrier to
            duplex formation</li>

            <li><strong>Environmental Contributions:</strong> The intrinsically unfavorable nature
            of A and B<sub>II</sub> forms emphasizes the importance of environmental factors
            (hydration, base stacking, protein interactions) in stabilizing these conformations</li>
          </ul>
        </section>

        <section class="about-section">
          <h3>Applications</h3>
          <ul>
            <li>Understanding DNA conformational equilibria and transitions</li>
            <li>Force field development and validation for nucleic acid simulations</li>
            <li>Predicting sequence-dependent DNA structural preferences</li>
            <li>Interpreting protein-DNA recognition mechanisms</li>
            <li>Analyzing single-stranded DNA structure and dynamics</li>
          </ul>
        </section>

        <section class="about-section">
          <h3>Significance</h3>
          <p>
            T3PS calculations demonstrate that the phosphodiester backbone makes a quantitative,
            significant contribution to DNA conformational properties. While environmental factors
            and base composition are crucial, the intrinsic mechanical properties of the backbone
            provide a fundamental energetic foundation that influences DNA structure in both
            crystalline and solution states.
          </p>
          <p>
            This work represents an important step toward comprehensive understanding of the
            energetic determinants governing DNA structure and function, with implications for
            fields ranging from structural biology to drug design.
          </p>
        </section>

        <section class="about-section">
          <h3>Reference</h3>
          <p class="citation">
            MacKerell, Jr A D. <em>Contribution of the intrinsic mechanical energy of the
            phosphodiester linkage to the relative stability of the A, B<sub>I</sub>, and
            B<sub>II</sub> forms of duplex DNA.</em> The Journal of Physical Chemistry B,
            2009, 113(10): 3235-3244.
          </p>
          <p class="citation-link">
            <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC2784611/" target="_blank">
              Read full article →
            </a>
          </p>
        </section>
      </div>
    </div>
  `;
}

export function init() {
  console.log('About T3PS page loaded');
}
