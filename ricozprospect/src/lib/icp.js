/**
 * Rule-based ICP matching (no AI).
 *
 * Each defined rule contributes to the score. An account matching every defined
 * rule scores 100. Rules left blank on the ICP are ignored entirely.
 */
export function scoreAccountAgainstIcp(account, icp) {
  const checks = [];

  const has = (arr) => Array.isArray(arr) && arr.length > 0;
  const eq = (a, b) => String(a || "").toLowerCase() === String(b || "").toLowerCase();

  if (has(icp.industries)) {
    checks.push({
      label: "Industry",
      passed: icp.industries.some((i) => eq(i, account.industry)),
    });
  }
  if (has(icp.locations)) {
    checks.push({
      label: "Location",
      passed: icp.locations.some((l) =>
        String(account.location || "").toLowerCase().includes(String(l).toLowerCase())
      ),
    });
  }
  if (has(icp.companyTypes)) {
    checks.push({
      label: "Company type",
      passed: icp.companyTypes.some((t) => eq(t, account.companyType)),
    });
  }
  if (has(icp.technologies)) {
    checks.push({
      label: "Technology",
      passed: icp.technologies.some((t) =>
        (account.technologies || []).some((at) => eq(at, t))
      ),
    });
  }
  if (has(icp.tags)) {
    checks.push({
      label: "Tags",
      passed: icp.tags.some((t) => (account.tags || []).some((at) => eq(at, t))),
    });
  }
  if (icp.minCompanySize != null || icp.maxCompanySize != null) {
    const size = account.companySize;
    checks.push({
      label: "Company size",
      passed:
        size != null &&
        (icp.minCompanySize == null || size >= icp.minCompanySize) &&
        (icp.maxCompanySize == null || size <= icp.maxCompanySize),
    });
  }
  if (icp.minRevenue != null || icp.maxRevenue != null) {
    const rev = account.revenue;
    checks.push({
      label: "Revenue",
      passed:
        rev != null &&
        (icp.minRevenue == null || rev >= icp.minRevenue) &&
        (icp.maxRevenue == null || rev <= icp.maxRevenue),
    });
  }

  if (checks.length === 0) return { score: 0, checks, matched: false };

  const passedCount = checks.filter((c) => c.passed).length;
  const score = Math.round((passedCount / checks.length) * 100);

  return { score, checks, matched: score === 100 };
}

export function rankAccounts(accounts, icp) {
  return accounts
    .map((account) => ({ account, ...scoreAccountAgainstIcp(account, icp) }))
    .sort((a, b) => b.score - a.score);
}
